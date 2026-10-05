// Runs scheduled jobs. Desktop: every 30 seconds while the app is open; jobs
// live in db.json, so anything that came due while it was closed runs on the
// next start. Hosted: Vercel Cron calls /api/cron/run.
import * as db from './db.js';
import { autopilot } from './automation.js';

const TICK_MS = 30_000;
let timer;
let running = false;

async function runJob(job) {
  db.update('jobs', job.id, { status: 'running', startedAt: db.now() });
  try {
    if (job.type === 'submit') {
      await autopilot(job.submissionId, { autoSubmit: job.autoSubmit !== false });
      db.update('jobs', job.id, { status: 'done', finishedAt: db.now() });
    } else {
      // Reminders are shown in the dashboard's "Due now" list.
      db.update('jobs', job.id, { status: 'due', finishedAt: db.now() });
      db.update('submissions', job.submissionId, { status: 'needs_human' });
      db.logActivity(`Reminder: ${job.title}`, { submissionId: job.submissionId });
    }
  } catch (e) {
    db.update('jobs', job.id, { status: 'failed', error: e.message, finishedAt: db.now() });
    db.logActivity(`Scheduled job failed: ${e.message}`, { submissionId: job.submissionId });
  }
}

/** Runs every job that is due, one at a time (each may open a browser). */
export async function runDueJobs() {
  const due = db.all('jobs').filter((j) => j.status === 'scheduled' && new Date(j.runAt) <= new Date());
  for (const job of due) await runJob(job);
  return due.length;
}

async function tick() {
  if (running) return;
  running = true;
  try {
    await runDueJobs();
  } catch (e) {
    // Never let a scheduler error take the app down.
    console.error('[scheduler]', e);
  } finally {
    running = false;
  }
}

export function startScheduler() {
  timer = setInterval(tick, TICK_MS);
  setTimeout(tick, 2000);
}

export function stopScheduler() {
  clearInterval(timer);
}
