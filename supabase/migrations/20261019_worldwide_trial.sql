-- ── Worldwide signup trial ──────────────────────────────────────────────────
-- Every new account, in every country, gets one free AI result (2 credits).
-- The same switch as "Worldwide" at /admin/trials; this file just sets it.
--
-- The existing rules still apply (lib/free-trial.server.ts): a new account,
-- a confirmed email at a big provider (Gmail, Outlook, Yahoo, iCloud), and
-- one grant per inbox, ever.
--
-- A country's own row overrides the worldwide one, live or stopped, so a
-- stopped country row keeps that country out. Remove such rows (or set them
-- live) at /admin/trials if every country should get the trial.
--
-- Re-runnable.

insert into public.trial_countries (country, credits, live)
values ('XX', 2, true)
on conflict (country) do update
  set credits = excluded.credits, live = true, updated_at = now();
