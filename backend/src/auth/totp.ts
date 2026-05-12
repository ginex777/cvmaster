import { createHmac, timingSafeEqual } from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TOTP_DIGITS = 6;
const TOTP_PERIOD_SECONDS = 30;
const TOTP_WINDOW = 1;

export function verifyTotp(token: string | undefined, secret: string | null | undefined, now = Date.now()): boolean {
  if (!token || !secret) return false;

  const normalizedToken = token.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(normalizedToken)) return false;

  const secretBuffer = decodeSecret(secret);
  const counter = Math.floor(now / 1000 / TOTP_PERIOD_SECONDS);

  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) {
    if (safeEqual(normalizedToken, generateTotp(secretBuffer, counter + offset))) {
      return true;
    }
  }

  return false;
}

export function generateTotpCode(secret: string, now = Date.now()): string {
  return generateTotp(decodeSecret(secret), Math.floor(now / 1000 / TOTP_PERIOD_SECONDS));
}

function decodeSecret(secret: string): Buffer {
  const normalized = secret.replace(/\s|=/g, '').toUpperCase();

  if (/^[0-9A-F]+$/i.test(normalized) && normalized.length % 2 === 0) {
    return Buffer.from(normalized, 'hex');
  }

  let bits = '';
  for (const char of normalized) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) return Buffer.alloc(0);
    bits += value.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
}

function generateTotp(secret: Buffer, counter: number): string {
  if (secret.length === 0) return ''.padStart(TOTP_DIGITS, '0');

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac('sha1', secret).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = (
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)
  );

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
}

function safeEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
