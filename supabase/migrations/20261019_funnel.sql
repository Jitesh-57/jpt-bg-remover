-- ── Signup funnel, by day ───────────────────────────────────────────────────
-- Read-only views over the events the site already records (public.user_events,
-- sent by lib/analytics.ts), signups (public.user_acquisition, written once per
-- new account) and purchases. Days are India time.
--
--   select * from analytics.funnel_daily limit 30;
--   select * from analytics.signups_by_source_daily limit 60;
--
-- "People" are counted once per day each: the account when signed in,
-- otherwise the browser's visitor id. Re-runnable.

create schema if not exists analytics;

create or replace view analytics.funnel_daily as
with ev as (
  select (created_at at time zone 'Asia/Kolkata')::date as day,
         name,
         coalesce(user_id::text, visitor_id, session_id) as who
    from public.user_events
   where created_at > now() - interval '180 days'
), steps as (
  select day,
         count(distinct who) filter (where name = 'page_view')                       as visitors,
         count(distinct who) filter (where name = 'app_upload')                      as uploaded_photo,
         count(distinct who) filter (where name in ('app_signin_click', 'app_signin_wall', 'Sign_In_Clicked')) as reached_sign_in,
         count(distinct who) filter (where name = 'sign_up')                         as signups_tracked,
         count(distinct who) filter (where name = 'app_generate_attempt')            as pressed_generate,
         count(distinct who) filter (where name = 'app_result')                      as got_ai_result,
         count(distinct who) filter (where name = 'paywall_shown')                   as saw_paywall,
         count(distinct who) filter (where name = 'app_download')                    as downloaded
    from ev
   group by day
), signups as (
  select (signed_up_at at time zone 'Asia/Kolkata')::date as day, count(*) as signups
    from public.user_acquisition
   group by 1
), pay as (
  select (created_at at time zone 'Asia/Kolkata')::date as day,
         count(*)                                          as purchases,
         round(coalesce(sum(amount_paise), 0) / 100.0, 2)  as revenue_inr
    from public.purchases
   group by 1
)
select s.day,
       s.visitors,
       s.uploaded_photo,
       s.reached_sign_in,
       coalesce(g.signups, 0)  as signups,
       s.signups_tracked,
       s.pressed_generate,
       s.got_ai_result,
       s.saw_paywall,
       s.downloaded,
       coalesce(p.purchases, 0)   as purchases,
       coalesce(p.revenue_inr, 0) as revenue_inr,
       round(100.0 * coalesce(g.signups, 0) / nullif(s.visitors, 0), 2) as visit_to_signup_pct
  from steps s
  left join signups g on g.day = s.day
  left join pay p     on p.day = s.day
 order by s.day desc;

-- Where each day's new accounts came from: UTM source when there is one,
-- otherwise the referring site, otherwise "direct".
create or replace view analytics.signups_by_source_daily as
select (signed_up_at at time zone 'Asia/Kolkata')::date as day,
       coalesce(nullif(utm_source, ''), nullif(referrer_host, ''), 'direct') as source,
       count(*) as signups,
       count(*) filter (where gclid is not null) as from_google_ads
  from public.user_acquisition
 group by 1, 2
 order by 1 desc, 3 desc;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on all tables in schema analytics from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on all tables in schema analytics from authenticated';
  end if;
end $$;

notify pgrst, 'reload schema';
