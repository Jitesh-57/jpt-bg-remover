-- ── Country free trials ─────────────────────────────────────────────────────
-- A new account gets a one-time credit grant when it signs up from a country
-- that has a live trial. Controlled from /admin/trials.
--
--   trial_countries  the rules: which country, how many credits, live or not
--   trial_grants     who has had a trial; one row per person, never deleted
--
-- Re-runnable, like every migration here.

create table if not exists public.trial_countries (
  country     text        primary key check (country ~ '^[A-Z]{2}$'),
  credits     integer     not null check (credits between 1 and 100),
  live        boolean     not null default false,
  updated_at  timestamptz not null default now()
);

create table if not exists public.trial_grants (
  -- Normalised email (lowercase, no "+tag", no dots for Gmail). Primary key, so
  -- the same inbox can never be granted twice, even after deleting the account
  -- and signing up again.
  email_key   text        primary key,
  user_id     uuid        unique references auth.users (id) on delete set null,
  email       text,
  country     text        not null,
  credits     integer     not null,
  granted_at  timestamptz not null default now()
);

create index if not exists trial_grants_country_idx on public.trial_grants (country, granted_at desc);

-- Service role only: no policies, so nobody signed in can read or write these.
alter table public.trial_countries enable row level security;
alter table public.trial_grants    enable row level security;

-- USA: 2 credits (one generation), live.
insert into public.trial_countries (country, credits, live)
values ('US', 2, true)
on conflict (country) do nothing;

-- ── claim_signup_trial ──────────────────────────────────────────────────────
-- The whole grant in one transaction: check the rule, claim the one-time slot,
-- add the credits, write the ledger. Two simultaneous calls for the same person
-- cannot both succeed — the second one hits the primary key and gets 0.
create or replace function public.claim_signup_trial(
  p_user_id   uuid,
  p_email_key text,
  p_email     text,
  p_country   text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits integer;
  v_balance integer;
begin
  select credits into v_credits
    from trial_countries
   where country = upper(p_country) and live;
  if v_credits is null then
    return 0;
  end if;

  insert into trial_grants (email_key, user_id, email, country, credits)
  values (p_email_key, p_user_id, p_email, upper(p_country), v_credits)
  on conflict do nothing;
  if not found then
    return 0;
  end if;

  update profiles
     set credits = coalesce(credits, 0) + v_credits
   where id = p_user_id
  returning credits into v_balance;

  if v_balance is null then
    insert into profiles (id, email, credits, plan)
    values (p_user_id, p_email, v_credits, 'free')
    on conflict (id) do update set credits = coalesce(profiles.credits, 0) + v_credits
    returning credits into v_balance;
  end if;

  insert into credit_ledger (user_id, delta, balance_after, reason, note)
  values (p_user_id, v_credits, v_balance, 'signup_grant', 'Free trial: ' || upper(p_country));

  return v_credits;
end;
$$;

revoke all on function public.claim_signup_trial(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.claim_signup_trial(uuid, text, text, text) to service_role;

-- Let the API see the new tables straight away.
notify pgrst, 'reload schema';
