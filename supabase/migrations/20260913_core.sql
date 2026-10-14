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

-- Columns the app writes, for a purchases table that predates this file.
-- Added nullable so they can never fail against rows that already exist.
alter table public.purchases add column if not exists user_id             uuid;
alter table public.purchases add column if not exists razorpay_order_id   text;
alter table public.purchases add column if not exists razorpay_payment_id text;
alter table public.purchases add column if not exists plan                text;
alter table public.purchases add column if not exists credits_added       integer;
alter table public.purchases add column if not exists amount_paise        integer;
alter table public.purchases add column if not exists invoice_no          text;
alter table public.purchases add column if not exists created_at          timestamptz not null default now();

-- One row per payment, one payment per invoice number. The payment id being
-- unique is what makes crediting exactly-once (a repeat insert is refused), so
-- an older table without the rule gets it — unless it already holds duplicates,
-- which are reported and left for a person to look at rather than deleted.
do $$
declare
  col text;
begin
  foreach col in array array['razorpay_payment_id', 'invoice_no'] loop
    if not exists (
      select 1 from pg_index i
        join pg_attribute a on a.attrelid = i.indrelid and a.attnum = i.indkey[0]
       where i.indrelid = 'public.purchases'::regclass and i.indisunique and i.indnatts = 1 and a.attname = col
    ) then
      begin
        execute format('create unique index purchases_%s_key on public.purchases (%I)', col, col);
      exception when others then
        raise notice 'purchases.% is not unique yet: %', col, sqlerrm;
      end;
    end if;
  end loop;
end $$;

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
alter table public.generations add column if not exists user_id       uuid;
alter table public.generations add column if not exists created_at    timestamptz not null default now();
alter table public.generations add column if not exists thumb         text;
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
--
-- purchase_id and generation_id take the type of the id they point at. The
-- live purchases and generations tables predate this file and were made with
-- uuid ids, not the bigserial the create statements above would give a new
-- database; a bigint column cannot reference a uuid, and that mismatch failed
-- this whole migration. Reading the real type keeps both kinds of database
-- working.
do $$
declare
  purchase_id_type   text;
  generation_id_type text;
begin
  select format_type(a.atttypid, a.atttypmod) into purchase_id_type
    from pg_attribute a
   where a.attrelid = 'public.purchases'::regclass and a.attname = 'id' and not a.attisdropped;
  select format_type(a.atttypid, a.atttypmod) into generation_id_type
    from pg_attribute a
   where a.attrelid = 'public.generations'::regclass and a.attname = 'id' and not a.attisdropped;

  execute format($ddl$
    create table if not exists public.credit_ledger (
      id            bigserial primary key,
      user_id       uuid        not null references auth.users (id) on delete cascade,
      delta         integer     not null,
      balance_after integer     not null,
      -- purchase | subscription | expired | generation | signup_grant | admin_adjust | refund
      reason        text        not null,
      tool          text,
      purchase_id   %s,
      generation_id %s,
      note          text,
      created_at    timestamptz not null default now()
    )$ddl$, coalesce(purchase_id_type, 'bigint'), coalesce(generation_id_type, 'bigint'));

  -- The links, added only where the types allow one. A ledger row must never
  -- fail to be written because its link cannot be made, so a link that cannot
  -- be made is left out rather than failing the migration.
  if not exists (select 1 from pg_constraint where conname = 'credit_ledger_purchase_id_fkey') then
    begin
      alter table public.credit_ledger add constraint credit_ledger_purchase_id_fkey
        foreign key (purchase_id) references public.purchases (id) on delete set null;
    exception when others then
      raise notice 'credit_ledger.purchase_id left without a foreign key: %', sqlerrm;
    end;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'credit_ledger_generation_id_fkey') then
    begin
      alter table public.credit_ledger add constraint credit_ledger_generation_id_fkey
        foreign key (generation_id) references public.generations (id) on delete set null;
    exception when others then
      raise notice 'credit_ledger.generation_id left without a foreign key: %', sqlerrm;
    end;
  end if;
end $$;

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
