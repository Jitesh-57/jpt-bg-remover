-- ── Country insights ────────────────────────────────────────────────────────
-- Where accounts sign up from and where purchases are made from, so
-- /admin/trials can show which countries actually buy credits.
--
--   user_countries      one row per account: the country it signed up from,
--                       and the country it last signed in from
--   purchase_countries  the country each purchase was paid from
--
-- The country is Vercel's own geo header, never anything the visitor sends.
-- Both are written best effort: a failed write never blocks a sign-in or a
-- payment. Re-runnable, like every migration here.

create table if not exists public.user_countries (
  user_id         uuid        primary key references auth.users (id) on delete cascade,
  signup_country  text        not null check (signup_country ~ '^[A-Z]{2}$'),
  last_country    text        check (last_country ~ '^[A-Z]{2}$'),
  first_seen      timestamptz not null default now(),
  last_seen       timestamptz not null default now()
);

create index if not exists user_countries_signup_idx on public.user_countries (signup_country);

create table if not exists public.purchase_countries (
  purchase_id  bigint      primary key references public.purchases (id) on delete cascade,
  user_id      uuid        not null references auth.users (id) on delete cascade,
  country      text        not null check (country ~ '^[A-Z]{2}$'),
  created_at   timestamptz not null default now()
);

create index if not exists purchase_countries_country_idx on public.purchase_countries (country);

-- Service role only: no policies, so nobody signed in can read or write these.
alter table public.user_countries     enable row level security;
alter table public.purchase_countries enable row level security;

notify pgrst, 'reload schema';
