// Runs scheduled jobs while the app is open. Jobs survive restarts because
// they live in db.json; anything that came due while the app was closed runs
// on the next start.
import * as db from './db.js';
import { runSubmission } from './automation.js';

const TICK_MS = 30_000;
let timer;
let running = false;

async function runJob(job) {
  db.update('jobs', job.id, { status: 'running', startedAt: db.now() });
  try {
    if (job.type === 'submit') {
      await runSubmission(job.submissionId, { autoSubmit: job.autoSubmit, createAccount: job.createAccount });
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

async function tick() {
  if (running) return;
  running = true;
  try {
    const due = db.all('jobs').filter((j) => j.status === 'scheduled' && new Date(j.runAt) <= new Date());
    // One at a time: each submission may open a browser window.
    for (const job of due) await runJob(job);
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
