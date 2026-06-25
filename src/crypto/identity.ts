import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
const { encodeBase64, decodeBase64 } = util;
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export interface Identity {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  signingPublicKey: Uint8Array;
  signingSecretKey: Uint8Array;
}

export interface SerializedIdentity {
  publicKey: string;
  secretKey: string;
  signingPublicKey: string;
  signingSecretKey: string;
  createdAt: string;
}

const AMP_DIR = join(homedir(), '.amp');
const KEYS_FILE = join(AMP_DIR, 'identity.json');

export function getAmpDir(): string {
  return AMP_DIR;
}

export function fingerprint(publicKey: Uint8Array): string {
  const hash = nacl.hash(publicKey);
  const bytes = Array.from(hash.slice(0, 6));
  return bytes.map(b => b.toString(16).padStart(2, '0')).join(':');
}

export function shortFingerprint(publicKey: Uint8Array): string {
  return fingerprint(publicKey).slice(0, 8);
}

export function generateIdentity(): Identity {
  const encryptionKeys = nacl.box.keyPair();
  const signingKeys = nacl.sign.keyPair();
  return {
    publicKey: encryptionKeys.publicKey,
    secretKey: encryptionKeys.secretKey,
    signingPublicKey: signingKeys.publicKey,
    signingSecretKey: signingKeys.secretKey,
  };
}

export function saveIdentity(identity: Identity): void {
  mkdirSync(AMP_DIR, { recursive: true, mode: 0o700 });
  const serialized: SerializedIdentity = {
    publicKey: encodeBase64(identity.publicKey),
    secretKey: encodeBase64(identity.secretKey),
    signingPublicKey: encodeBase64(identity.signingPublicKey),
    signingSecretKey: encodeBase64(identity.signingSecretKey),
    createdAt: new Date().toISOString(),
  };
  writeFileSync(KEYS_FILE, JSON.stringify(serialized, null, 2), { mode: 0o600 });
}

export function loadIdentity(): Identity | null {
  if (!existsSync(KEYS_FILE)) return null;
  const raw = JSON.parse(readFileSync(KEYS_FILE, 'utf-8')) as SerializedIdentity;
  return {
    publicKey: decodeBase64(raw.publicKey),
    secretKey: decodeBase64(raw.secretKey),
    signingPublicKey: decodeBase64(raw.signingPublicKey),
    signingSecretKey: decodeBase64(raw.signingSecretKey),
  };
}

export function ensureIdentity(): Identity {
  const existing = loadIdentity();
  if (existing) return existing;
  const identity = generateIdentity();
  saveIdentity(identity);
  return identity;
}

export function signMessage(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
  return nacl.sign.detached(message, secretKey);
}

export function verifySignature(message: Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean {
  return nacl.sign.detached.verify(message, signature, publicKey);
}
