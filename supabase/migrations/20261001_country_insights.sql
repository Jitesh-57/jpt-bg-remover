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

-- purchase_id takes the type of purchases.id, which is uuid on the live
-- database (made before the migrations) and bigint on a new one — see the
-- credit_ledger note in 20260913_core.sql.
do $$
declare
  purchase_id_type text;
begin
  select format_type(a.atttypid, a.atttypmod) into purchase_id_type
    from pg_attribute a
   where a.attrelid = 'public.purchases'::regclass and a.attname = 'id' and not a.attisdropped;

  execute format($ddl$
    create table if not exists public.purchase_countries (
      purchase_id  %s          primary key,
      user_id      uuid        not null references auth.users (id) on delete cascade,
      country      text        not null check (country ~ '^[A-Z]{2}$'),
      created_at   timestamptz not null default now()
    )$ddl$, coalesce(purchase_id_type, 'bigint'));

  if not exists (select 1 from pg_constraint where conname = 'purchase_countries_purchase_id_fkey') then
    begin
      alter table public.purchase_countries add constraint purchase_countries_purchase_id_fkey
        foreign key (purchase_id) references public.purchases (id) on delete cascade;
    exception when others then
      raise notice 'purchase_countries.purchase_id left without a foreign key: %', sqlerrm;
    end;
  end if;
end $$;

create index if not exists purchase_countries_country_idx on public.purchase_countries (country);

-- Service role only: no policies, so nobody signed in can read or write these.
alter table public.user_countries     enable row level security;
alter table public.purchase_countries enable row level security;

notify pgrst, 'reload schema';
