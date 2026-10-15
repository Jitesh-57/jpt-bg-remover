-- ============================================================================
-- Pixel Shine — user insights: ready-to-run queries
--
-- Paste any one of these into Supabase → SQL Editor and press Run.
-- They read the views made by supabase/migrations/20261015_user_insights.sql
-- (schema `analytics`), which only you can see — the website's data API
-- cannot. Change the dates, emails and limits to taste.
-- ============================================================================


-- 1. Everyone, newest first: where they came from, what they did, what they paid.
select email, signed_up_at, country, city, source, medium, campaign, landing_path,
       device, generations, failed_generations, top_tool,
       purchases, revenue_inr, active_monthly_plans, addon_credits, monthly_credits, last_active_at
  from analytics.users_overview
 order by signed_up_at desc
 limit 200;


-- 2. One user's full story, in time order (page views, clicks, generations,
--    purchases, credits). Put their email in.
select at, kind, what, detail, link, extra
  from analytics.user_timeline
 where email = 'someone@gmail.com'
 order by at;


-- 3. Signups per week, by source.
select date_trunc('week', signed_up_at)::date as week, coalesce(source, 'unknown') as source, count(*) as signups
  from analytics.users_overview
 where signed_up_at > now() - interval '90 days'
 group by 1, 2
 order by 1 desc, 3 desc;


-- 4. Which sources bring users who generate and pay.
select coalesce(source, 'unknown')                          as source,
       count(*)                                             as signups,
       count(*) filter (where generations > 0)              as made_something,
       count(*) filter (where purchases > 0)                as paid,
       round(100.0 * count(*) filter (where purchases > 0) / nullif(count(*), 0), 1) as paid_pct,
       sum(revenue_inr)                                     as revenue_inr
  from analytics.users_overview
 group by 1
 order by revenue_inr desc nulls last, signups desc;


-- 5. Campaigns (UTM) with signups, payers and revenue.
select source, medium, campaign, count(*) as signups,
       count(*) filter (where purchases > 0) as paid, sum(revenue_inr) as revenue_inr
  from analytics.users_overview
 where campaign is not null
 group by 1, 2, 3
 order by revenue_inr desc nulls last, signups desc;


-- 6. Landing pages that bring signups.
select landing_path, count(*) as signups, count(*) filter (where purchases > 0) as paid
  from analytics.users_overview
 where landing_path is not null
 group by 1
 order by signups desc
 limit 50;


-- 7. Referring websites.
select coalesce(referrer_host, '(direct / none)') as referrer, count(*) as signups
  from public.user_acquisition
 group by 1
 order by 2 desc
 limit 50;


-- 8. Most-used AI tools and apps, with failure rate (last 30 days).
select tool,
       count(*)                                                  as attempts,
       count(*) filter (where status = 'succeeded')              as succeeded,
       count(*) filter (where status = 'failed')                 as failed,
       round(100.0 * count(*) filter (where status = 'failed') / nullif(count(*), 0), 1) as failed_pct,
       count(distinct user_id)                                   as users
  from analytics.generations
 where created_at > now() - interval '30 days'
 group by 1
 order by attempts desc;


-- 9. What people ask for: most common prompts per tool (last 30 days).
select tool, lower(trim(prompt)) as prompt, count(*) as times, count(distinct user_id) as users
  from analytics.generations
 where prompt is not null and prompt <> '' and created_at > now() - interval '30 days'
 group by 1, 2
 order by times desc
 limit 100;


-- 10. Latest uploads and what came out — open the links to see the images.
select created_at, email, tool, prompt, upload_url, result_url, status, error
  from analytics.generations
 order by created_at desc
 limit 100;


-- 11. Failed generations and why (what people tried that did not work).
select created_at, email, tool, prompt, error, upload_url
  from analytics.generations
 where status = 'failed'
 order by created_at desc
 limit 100;


-- 12. Signed up but never made anything (and how they found you).
select email, signed_up_at, source, landing_path, country, device
  from analytics.users_overview
 where generations = 0
 order by signed_up_at desc
 limit 200;


-- 13. Made things but never paid (good people to understand / win back).
select email, signed_up_at, source, generations, top_tool, last_active_at
  from analytics.users_overview
 where generations > 0 and purchases = 0
 order by generations desc
 limit 200;


-- 14. Paying users: what they made before their first purchase.
select o.email, o.first_purchase_at, g.tool, count(*) as times
  from analytics.users_overview o
  join analytics.generations g on g.user_id = o.user_id and g.created_at < o.first_purchase_at
 where o.purchases > 0
 group by 1, 2, 3
 order by 2 desc, 4 desc;


-- 15. The funnel, last 30 days: visitors → viewed pricing → started checkout → paid.
select count(distinct coalesce(user_id::text, visitor_id))                                              as visitors,
       count(distinct coalesce(user_id::text, visitor_id)) filter (where name = 'Payment_PopUp_Triggered') as saw_pricing,
       count(distinct coalesce(user_id::text, visitor_id)) filter (where name = 'Checkout_Initiated')      as started_checkout,
       count(distinct coalesce(user_id::text, visitor_id)) filter (where name = 'purchase')                as paid
  from public.user_events
 where created_at > now() - interval '30 days';


-- 16. Most-visited pages (last 7 days).
select path, count(*) as views, count(distinct coalesce(user_id::text, visitor_id)) as people
  from public.user_events
 where name = 'page_view' and created_at > now() - interval '7 days'
 group by 1
 order by views desc
 limit 50;


-- 17. What happens most, by event name (last 7 days). Names include page_view,
--     tool_use, Image_Uploaded, Generate_Button_Clicked, Image_Generated,
--     Image_Generation_Failed, Download_Button_Clicked, Sign_In_Clicked,
--     Sign_In_Completed, Payment_PopUp_Triggered, Buy_Button_Clicked,
--     Checkout_Initiated, purchase, Payment_Failed.
select name, count(*) as times, count(distinct coalesce(user_id::text, visitor_id)) as people
  from public.user_events
 where created_at > now() - interval '7 days'
 group by 1
 order by times desc;


-- 18. Countries and devices of signups.
select country, device, count(*) as signups, count(*) filter (where purchases > 0) as paid
  from analytics.users_overview
 group by 1, 2
 order by signups desc;


-- 19. Monthly plans: who is on what, and who cancelled.
select u.email, s.plan, s.status, s.cancel_at_cycle_end, s.credits_remaining,
       s.credits_expire_at, s.created_at
  from public.subscriptions s
  join auth.users u on u.id = s.user_id
 where s.status <> 'created'
 order by s.created_at desc;


-- 20. Revenue by day (last 60 days).
select created_at::date as day, count(*) as payments, round(sum(amount_paise) / 100.0, 2) as revenue_inr
  from public.purchases
 where created_at > now() - interval '60 days'
 group by 1
 order by 1 desc;
