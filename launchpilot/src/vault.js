// Encrypts platform passwords at rest with AES-256-GCM. The key is derived from
// LAUNCHPILOT_MASTER_KEY (or a generated key file) and never stored in db.json.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA_DIR } from './db.js';

let key;

function masterSecret() {
  if (process.env.LAUNCHPILOT_MASTER_KEY) return process.env.LAUNCHPILOT_MASTER_KEY;
  const file = path.join(DATA_DIR, '.master.key');
  if (!fs.existsSync(file)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(file, crypto.randomBytes(32).toString('hex'), { mode: 0o600 });
    console.warn(`[vault] LAUNCHPILOT_MASTER_KEY not set; generated ${file}. Back it up.`);
  }
  return fs.readFileSync(file, 'utf8').trim();
}

function getKey() {
  if (key) return key;
  const saltFile = path.join(DATA_DIR, '.vault.salt');
  if (!fs.existsSync(saltFile)) fs.writeFileSync(saltFile, crypto.randomBytes(16), { mode: 0o600 });
  key = crypto.scryptSync(masterSecret(), fs.readFileSync(saltFile), 32);
  return key;
}

export function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const ct = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), ct.toString('base64')].join(':');
}

export function decrypt(blob) {
  const [v, iv, tag, ct] = String(blob).split(':');
  if (v !== 'v1') throw new Error('Unknown vault format');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(ct, 'base64')), decipher.final()]).toString('utf8');
}

export function mask(email) {
  const [user, domain] = String(email).split('@');
  if (!domain) return '•••';
  return `${user.slice(0, 2)}${'•'.repeat(Math.max(1, user.length - 2))}@${domain}`;
}
