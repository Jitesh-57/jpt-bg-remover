// Desktop entry point: serves LaunchPilot on your computer.
try {
  process.loadEnvFile('.env');
} catch {
  // No .env file; rely on the real environment.
}

const db = await import('./db.js');
const { app } = await import('./app.js');
const automation = await import('./automation.js');
const { closeInspector } = await import('./inspect.js');
const { startScheduler, stopScheduler } = await import('./scheduler.js');
const { aiConfigured } = await import('./ai.js');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 4310);
const isLocal = ['127.0.0.1', 'localhost', '::1'].includes(HOST);
const hosted = process.env.LAUNCHPILOT_CLOUD === '1';

if (!hosted && !isLocal && !process.env.LAUNCHPILOT_APP_PASSWORD) {
  console.error('Refusing to listen on a public interface without LAUNCHPILOT_APP_PASSWORD. Set it in .env.');
  process.exit(1);
}

if (!hosted) db.load();

const server = app.listen(PORT, HOST, () => {
  console.log(`LaunchPilot running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}${hosted ? ' (hosted mode)' : ''}`);
  if (!aiConfigured()) console.log('AI features are off until ANTHROPIC_API_KEY is set in .env');
});
if (!hosted) startScheduler();

async function shutdown() {
  stopScheduler();
  server.close();
  await Promise.all([automation.closeAll(), closeInspector()]);
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
