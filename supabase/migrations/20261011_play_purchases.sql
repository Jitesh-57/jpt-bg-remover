-- ── Google Play purchases ───────────────────────────────────────────────────
-- Credits bought inside the Android apps, through Google Play Billing.
--
-- One row per purchase token. The unique token is what makes crediting
-- exactly-once: /api/play/verify claims the token by inserting this row before
-- it adds any credits, so a retried or duplicated request finds the row and
-- adds nothing. Google is the merchant of record and issues the receipt, so
-- these are kept apart from public.purchases, which carries our own invoices.
--
-- Re-runnable, like every migration here.

create table if not exists public.play_purchases (
  id              bigserial primary key,
  user_id         uuid        not null references auth.users (id) on delete cascade,
  package_name    text        not null,
  product_id      text        not null,
  purchase_token  text        not null unique,
  order_id        text,
  credits_added   integer     not null,
  region          text,
  test_purchase   boolean     not null default false,
  consumed        boolean     not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists play_purchases_user_created_idx
  on public.play_purchases (user_id, created_at desc);

-- Service role only: no policies, so nobody signed in can read or write these.
alter table public.play_purchases enable row level security;

notify pgrst, 'reload schema';
