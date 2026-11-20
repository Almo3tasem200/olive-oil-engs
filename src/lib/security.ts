import 'server-only';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function encryptionKey() {
  const configured = process.env.APP_ENCRYPTION_KEY;
  if (configured && /^[a-fA-F0-9]{64}$/.test(configured)) {
    return Buffer.from(configured, 'hex');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('APP_ENCRYPTION_KEY must be a 32-byte hex value in production.');
  }

  return createHash('sha256').update('local-development-only-key-change-before-deploy').digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

export function decryptSecret(value: string) {
  const input = Buffer.from(value, 'base64url');
  if (input.length < 29) {
    throw new Error('Encrypted secret is invalid.');
  }
  const iv = input.subarray(0, 12);
  const tag = input.subarray(12, 28);
  const encrypted = input.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function newOpaqueToken() {
  return randomBytes(32).toString('base64url');
}

