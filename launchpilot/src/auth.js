// Accounts for the hosted version: email + password, scrypt-hashed, with a
// signed session cookie. Optional LAUNCHPILOT_INVITE_CODE limits who can sign up.
import crypto from 'node:crypto';
import { getJson, setJson } from './store.js';

const COOKIE = 'lp_s';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const secret = () => {
  if (!process.env.LAUNCHPILOT_SECRET) throw new Error('LAUNCHPILOT_SECRET is not set on the server.');
  return process.env.LAUNCHPILOT_SECRET;
};
const emailKey = (email) => `lp:user:${crypto.createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex')}`;
const hash = (password, salt) => crypto.scryptSync(String(password), salt, 64).toString('hex');
const sign = (value) => crypto.createHmac('sha256', secret()).update(value).digest('base64url');

function issue(res, userId) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const value = `${userId}.${exp}`;
  const secure = process.env.VERCEL ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${value}.${sign(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}${secure}`);
}

export function readSession(req) {
  const raw = (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw) return null;
  const [userId, exp, sig] = raw.split('.');
  if (!userId || !exp || !sig) return null;
  const expected = sign(`${userId}.${exp}`);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return userId;
}

const bad = (message, status = 400) => Object.assign(new Error(message), { status });

export async function signup(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw bad('Enter a valid email address.');
  if (password.length < 8) throw bad('Use a password of at least 8 characters.');
  if (process.env.LAUNCHPILOT_INVITE_CODE && req.body.invite !== process.env.LAUNCHPILOT_INVITE_CODE) throw bad('That invite code is not valid.', 403);
  if (await getJson(emailKey(email))) throw bad('An account with this email already exists. Log in instead.', 409);
  const salt = crypto.randomBytes(16).toString('hex');
  const user = { id: crypto.randomUUID(), email, salt, hash: hash(password, salt), createdAt: new Date().toISOString() };
  await setJson(emailKey(email), user);
  await setJson(`lp:email:${user.id}`, email);
  issue(res, user.id);
  return { email };
}

export async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await getJson(emailKey(email));
  const given = user ? hash(req.body.password || '', user.salt) : '';
  if (!user || !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(user.hash))) throw bad('Wrong email or password.', 401);
  issue(res, user.id);
  await setJson(`lp:email:${user.id}`, email);
  return { email };
}

export function logout(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

export async function emailFor(userId) {
  return getJson(`lp:email:${userId}`);
}
