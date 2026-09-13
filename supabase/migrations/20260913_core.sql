-- ============================================================================
-- Pixel Shine — core schema
--
-- Safe to run more than once: every statement is guarded, so re-running it
-- changes nothing. It creates what is missing and adds columns to what already
-- exists, and never drops or rewrites a column that holds data.
--
-- Apply it with GET /api/admin/migrate?token=<ADMIN_IMAGE_TOKEN>&apply=1, or by
-- pasting it into the Supabase SQL editor.
--
-- Four tables:
--   profiles       who the user is, and what their balance is now
--   purchases      what they bought, and the invoice raised for it
--   generations    every image made: what went in, what came out, what it cost
--   credit_ledger  every movement of a credit, so a balance can be explained
-- ============================================================================


-- ── profiles ────────────────────────────────────────────────────────────────
-- The account. `credits` is the live balance; credit_ledger explains how it
-- got there. `plan` is the pack most recently bought, or 'free'.
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  name       text,
  picture    text,
  credits    integer     not null default 0,
  plan       text        not null default 'free',
  created_at timestamptz not null default now()
);

-- Columns added over time. Each is guarded, so this is safe against a profiles
-- table that predates any of them.
alter table public.profiles add column if not exists email      text;
alter table public.profiles add column if not exists name       text;
alter table public.profiles add column if not exists picture    text;
alter table public.profiles add column if not exists credits    integer     not null default 0;
alter table public.profiles add column if not exists plan       text        not null default 'free';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
-- Paid accounts do not reset daily; kept because checkAuth writes it.
alter table public.profiles add column if not exists daily_credits_reset_at timestamptz;

create index if not exists profiles_email_idx on public.profiles (email);

alter table public.profiles enable row level security;
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);
-- No insert/update policy on purpose: balances are written only by the service
-- role, from verify-payment and withCredits. A user who could update their own
-- row could give themselves credits.


-- ── purchases ───────────────────────────────────────────────────────────────
-- One row per completed payment. Razorpay remains the record of the money;
-- this is our copy, and it pins the invoice number issued at the time.
create table if not exists public.purchases (
  id                  bigserial primary key,
  user_id             uuid        not null references auth.users (id) on delete cascade,
  razorpay_order_id   text        not null,
  razorpay_payment_id text        not null unique,
  plan                text        not null,
  credits_added       integer     not null,
  amount_paise        integer     not null,
  invoice_no          text unique,
  created_at          timestamptz not null default now()
);

create index if not exists purchases_user_created_idx
  on public.purchases (user_id, created_at desc);

alter table public.purchases enable row level security;
drop policy if exists "purchases: read own" on public.purchases;
create policy "purchases: read own" on public.purchases
  for select using (auth.uid() = user_id);


-- ── generations ─────────────────────────────────────────────────────────────
-- Every image the AI made, with both ends of it: the photo that went in and
-- the image that came out, as URLs rather than as bytes in a column.
create table if not exists public.generations (
  id            bigserial primary key,
  user_id       uuid        not null references auth.users (id) on delete cascade,
  tool          text        not null,
  category      text        not null default 'generation',
  label         text        not null default 'Image',
  thumb         text,
  image_url     text,
  original_name text,
  created_at    timestamptz not null default now()
);

-- What the original table could not answer: which photo this came from, which
-- model made it, what it was asked for, and what it cost.
alter table public.generations add column if not exists source_url    text;
alter table public.generations add column if not exists result_url    text;
alter table public.generations add column if not exists app_slug      text;
alter table public.generations add column if not exists model         text;
alter table public.generations add column if not exists provider      text;
alter table public.generations add column if not exists prompt        text;
alter table public.generations add column if not exists preset        text;
alter table public.generations add column if not exists aspect_ratio  text;
alter table public.generations add column if not exists credits_spent integer not null default 0;
alter table public.generations add column if not exists status        text    not null default 'succeeded';
alter table public.generations add column if not exists error         text;
alter table public.generations add column if not exists duration_ms   integer;

-- `thumb` held a base64 data URL, which is why it needed a 25KB cap. New rows
-- carry result_url instead; the column stays so old rows still render.
comment on column public.generations.thumb is
  'Legacy base64 preview. New rows use result_url; kept so existing rows render.';

create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);
create index if not exists generations_tool_idx
  on public.generations (tool, created_at desc);
-- Failures are worth finding on their own: they are the ones that cost money
-- at the provider without producing anything.
create index if not exists generations_status_idx
  on public.generations (status, created_at desc) where status <> 'succeeded';

alter table public.generations enable row level security;
drop policy if exists "generations: read own" on public.generations;
create policy "generations: read own" on public.generations
  for select using (auth.uid() = user_id);
drop policy if exists "generations: delete own" on public.generations;
create policy "generations: delete own" on public.generations
  for delete using (auth.uid() = user_id);


-- ── credit_ledger ───────────────────────────────────────────────────────────
-- Every movement of a credit, positive or negative, with the balance it left
-- behind. This is what makes a balance explainable: "why do I have 11?" is a
-- query, not a guess.
--
-- `delta` is signed: +5 for a purchase, -2 for a generation.
create table if not exists public.credit_ledger (
  id            bigserial primary key,
  user_id       uuid        not null references auth.users (id) on delete cascade,
  delta         integer     not null,
  balance_after integer     not null,
  -- purchase | generation | signup_grant | admin_adjust | refund
  reason        text        not null,
  tool          text,
  purchase_id   bigint references public.purchases (id) on delete set null,
  generation_id bigint references public.generations (id) on delete set null,
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists credit_ledger_user_created_idx
  on public.credit_ledger (user_id, created_at desc);

alter table public.credit_ledger enable row level security;
drop policy if exists "credit_ledger: read own" on public.credit_ledger;
create policy "credit_ledger: read own" on public.credit_ledger
  for select using (auth.uid() = user_id);
-- Insert is service-role only. A ledger a user can write to is not a ledger.


-- ── done ────────────────────────────────────────────────────────────────────
-- Writes come from the service role, which bypasses RLS, so no insert or update
-- policy is needed anywhere above. The select policies are what let a signed-in
-- user read their own invoices, generations and credit history — and only their
-- own.
