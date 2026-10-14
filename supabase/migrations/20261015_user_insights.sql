-- ── User insights ───────────────────────────────────────────────────────────
-- Where each user came from, and everything they did, so the product can be
-- improved from what people actually try.
--
--   user_acquisition  one row per account: first-touch source (referrer,
--                     landing page, UTM tags, ad click ids), location and
--                     device at signup. Written by lib/acquisition.server.ts.
--   user_events       page views and actions, from trackEvent() in the browser
--                     through /api/track. Anonymous until signup, then linked
--                     to the account by visitor id.
--
-- AI generations (upload link, result link, tool, prompt, model, outcome) are
-- in public.generations, written by lib/ledger.ts.
--
-- Read it through the views in the `analytics` schema at the end of this file.
-- That schema is not exposed by the website's data API: only the SQL editor and
-- the table viewer (the postgres role) can see it.
--
-- Re-runnable, like every migration here.

create table if not exists public.user_acquisition (
  user_id            uuid        primary key references auth.users (id) on delete cascade,
  visitor_id         text,
  first_seen_at      timestamptz,
  signed_up_at       timestamptz not null default now(),
  -- First touch: the visit that brought them, kept from their first page view.
  referrer           text,
  referrer_host      text,
  landing_path       text,
  utm_source         text,
  utm_medium         text,
  utm_campaign       text,
  utm_term           text,
  utm_content        text,
  gclid              text,
  fbclid             text,
  -- Last touch before signup, when it differs from the first.
  last_utm_source    text,
  last_utm_medium    text,
  last_utm_campaign  text,
  -- Where and on what they signed up.
  country            text,
  region             text,
  city               text,
  device             text,
  browser            text,
  os                 text,
  language           text,
  user_agent         text
);

create index if not exists user_acquisition_source_idx on public.user_acquisition (utm_source, referrer_host);
create index if not exists user_acquisition_signed_up_idx on public.user_acquisition (signed_up_at desc);

create table if not exists public.user_events (
  id          bigserial   primary key,
  created_at  timestamptz not null default now(),
  user_id     uuid        references auth.users (id) on delete set null,
  visitor_id  text,
  session_id  text,
  name        text        not null,
  path        text,
  props       jsonb       not null default '{}'::jsonb,
  country     text,
  device      text
);

create index if not exists user_events_user_idx    on public.user_events (user_id, created_at desc);
create index if not exists user_events_visitor_idx on public.user_events (visitor_id, created_at desc);
create index if not exists user_events_name_idx    on public.user_events (name, created_at desc);
create index if not exists user_events_time_idx    on public.user_events (created_at desc);

-- Service role only: no policies, so nobody signed in can read or write these.
alter table public.user_acquisition enable row level security;
alter table public.user_events      enable row level security;


-- ── analytics: read-only views ──────────────────────────────────────────────
create schema if not exists analytics;

-- One row per user: who, from where, on what, and what they did and paid.
create or replace view analytics.users_overview as
with gen as (
  select user_id,
         count(*) filter (where coalesce(status, 'succeeded') = 'succeeded') as generations,
         count(*) filter (where status = 'failed')                          as failed_generations,
         max(created_at)                                                    as last_generation_at
    from public.generations
   group by user_id
), tool_rank as (
  select user_id, coalesce(app_slug, tool) as tool,
         row_number() over (partition by user_id order by count(*) desc, max(created_at) desc) as rn
    from public.generations
   group by user_id, coalesce(app_slug, tool)
), pay as (
  select user_id,
         count(*)                                   as purchases,
         round(coalesce(sum(amount_paise), 0) / 100.0, 2) as revenue_inr,
         min(created_at)                            as first_purchase_at,
         max(created_at)                            as last_purchase_at
    from public.purchases
   group by user_id
), plans as (
  select user_id,
         count(*) filter (where status in ('authenticated', 'active', 'pending') and not cancel_at_cycle_end) as active_monthly_plans,
         coalesce(sum(credits_remaining) filter (where credits_expire_at > now()), 0)                         as monthly_credits
    from public.subscriptions
   group by user_id
), ev as (
  select user_id, count(*) as events, max(created_at) as last_event_at
    from public.user_events
   where user_id is not null
   group by user_id
)
select u.id                                                        as user_id,
       u.email,
       coalesce(p.name, u.raw_user_meta_data ->> 'name')           as name,
       u.created_at                                                as signed_up_at,
       coalesce(a.country, uc.signup_country)                      as country,
       a.region,
       a.city,
       coalesce(nullif(a.utm_source, ''), a.referrer_host, case when a.user_id is not null then 'direct' end) as source,
       a.utm_medium                                                as medium,
       a.utm_campaign                                              as campaign,
       a.landing_path,
       a.referrer,
       a.device,
       a.browser,
       a.os,
       coalesce(p.credits, 0)                                      as addon_credits,
       coalesce(plans.monthly_credits, 0)                          as monthly_credits,
       coalesce(plans.active_monthly_plans, 0)                     as active_monthly_plans,
       coalesce(pay.purchases, 0)                                  as purchases,
       coalesce(pay.revenue_inr, 0)                                as revenue_inr,
       pay.first_purchase_at,
       coalesce(gen.generations, 0)                                as generations,
       coalesce(gen.failed_generations, 0)                         as failed_generations,
       tr.tool                                                     as top_tool,
       coalesce(ev.events, 0)                                      as events,
       greatest(gen.last_generation_at, ev.last_event_at, pay.last_purchase_at, u.last_sign_in_at) as last_active_at
  from auth.users u
  left join public.profiles         p   on p.id = u.id
  left join public.user_acquisition a   on a.user_id = u.id
  left join public.user_countries   uc  on uc.user_id = u.id
  left join gen                         on gen.user_id = u.id
  left join tool_rank               tr  on tr.user_id = u.id and tr.rn = 1
  left join pay                         on pay.user_id = u.id
  left join plans                       on plans.user_id = u.id
  left join ev                          on ev.user_id = u.id;

-- Every AI generation: who, which tool, what they asked for, the photo they
-- uploaded and the image they got back.
create or replace view analytics.generations as
select g.id::text                                   as id,
       g.created_at,
       u.email,
       g.user_id,
       coalesce(g.app_slug, g.tool)                 as tool,
       g.tool                                       as route,
       g.app_slug,
       g.prompt,
       g.preset,
       g.source_url                                 as upload_url,
       coalesce(nullif(g.result_url, ''), nullif(g.image_url, '')) as result_url,
       coalesce(g.status, 'succeeded')              as status,
       g.error,
       g.model,
       g.provider,
       g.credits_spent,
       g.duration_ms,
       g.aspect_ratio
  from public.generations g
  left join auth.users u on u.id = g.user_id;

-- Everything a user did, in time order: events, generations, purchases and
-- credit movements. Filter by email or user_id.
create or replace view analytics.user_timeline as
select t.user_id, u.email, t.at, t.kind, t.what, t.detail, t.link, t.extra
  from (
    select e.user_id, e.created_at as at, 'event'::text as kind, e.name as what,
           e.path as detail, null::text as link, e.props as extra
      from public.user_events e
     where e.user_id is not null
    union all
    select g.user_id, g.created_at, 'generation',
           coalesce(g.app_slug, g.tool) || case when g.status = 'failed' then ' (failed)' else '' end,
           left(g.prompt, 300),
           coalesce(nullif(g.result_url, ''), nullif(g.image_url, '')),
           jsonb_strip_nulls(jsonb_build_object('upload', g.source_url, 'error', g.error, 'model', g.model, 'credits', g.credits_spent))
      from public.generations g
    union all
    select p.user_id, p.created_at, 'purchase', p.plan,
           coalesce(round(p.amount_paise / 100.0, 2)::text || ' INR', ''),
           null,
           jsonb_strip_nulls(jsonb_build_object('payment', p.razorpay_payment_id, 'credits', p.credits_added, 'invoice', p.invoice_no))
      from public.purchases p
    union all
    select l.user_id, l.created_at, 'credits', l.reason,
           (case when l.delta > 0 then '+' else '' end) || l.delta || ' → ' || l.balance_after,
           null,
           jsonb_strip_nulls(jsonb_build_object('tool', l.tool, 'note', l.note))
      from public.credit_ledger l
  ) t
  left join auth.users u on u.id = t.user_id;

-- Keep the views away from the website's data API roles. They live in a schema
-- the API does not expose; this makes sure no grant opens them up either.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on schema analytics from anon';
    execute 'revoke all on all tables in schema analytics from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on schema analytics from authenticated';
    execute 'revoke all on all tables in schema analytics from authenticated';
  end if;
end $$;

notify pgrst, 'reload schema';
