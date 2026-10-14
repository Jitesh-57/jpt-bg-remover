-- ── Monthly plans (Razorpay subscriptions) ─────────────────────────────────
-- One row per Razorpay subscription. Someone can hold several at once.
--
-- Monthly credits live here rather than in profiles.credits, because they
-- behave differently: each paid month grants `credits_per_cycle`, usable until
-- `credits_expire_at` (the end of that month), and the next renewal resets
-- `credits_remaining` instead of adding to it. One-time add-on credits stay in
-- profiles.credits and never expire. lib/subscriptions.server.ts spends the
-- monthly credits first, soonest-to-expire first.
--
-- Crediting is exactly-once through public.purchases: every charge, the first
-- month and each renewal, inserts a purchase row keyed by its unique
-- razorpay_payment_id before any credits move, so a webhook that arrives twice,
-- or arrives after the checkout already credited the payment, adds nothing.
--
-- Re-runnable, like every migration here.

create table if not exists public.subscriptions (
  id                        bigserial primary key,
  user_id                   uuid        not null references auth.users (id) on delete cascade,
  plan                      text        not null,
  razorpay_subscription_id  text        not null unique,
  razorpay_plan_id          text        not null,
  -- created | authenticated | active | pending | halted | paused | cancelled | completed | expired
  status                    text        not null default 'created',
  credits_per_cycle         integer     not null,
  amount_paise              integer     not null,
  credits_remaining         integer     not null default 0,
  credits_expire_at         timestamptz,
  current_start             timestamptz,
  current_end               timestamptz,
  cancel_at_cycle_end       boolean     not null default false,
  cancelled_at              timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists subscriptions_user_idx
  on public.subscriptions (user_id, created_at desc);

alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions: read own" on public.subscriptions;
create policy "subscriptions: read own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Razorpay plans are created by the app the first time a price is sold, and
-- remembered here. The key includes the amount, so a price change makes a new
-- plan and existing subscribers stay on the one they signed up to.
create table if not exists public.razorpay_plans (
  key               text        primary key,
  razorpay_plan_id  text        not null,
  created_at        timestamptz not null default now()
);

-- Service role only: no policies.
alter table public.razorpay_plans enable row level security;

-- Subscription charges are purchases too: they get an invoice like any pack.
-- A subscription payment has no order created by us, so the order id becomes
-- optional and the subscription it belongs to is recorded instead.
alter table public.purchases alter column razorpay_order_id drop not null;
alter table public.purchases add column if not exists razorpay_subscription_id text;

notify pgrst, 'reload schema';
