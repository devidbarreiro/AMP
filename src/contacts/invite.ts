import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
const { encodeBase64, decodeBase64 } = util;
import type { Identity } from '../crypto/identity.js';
import { fingerprint, shortFingerprint } from '../crypto/identity.js';

export interface InvitePayload {
  v: 1;
  pk: string;
  sk: string;
  name: string;
  addr: string;
  fp: string;
  exp: number;
}

const INVITE_TTL_MS = 15 * 60 * 1000;

export function createInvite(identity: Identity, name: string, address: string): string {
  const payload: InvitePayload = {
    v: 1,
    pk: encodeBase64(identity.publicKey),
    sk: encodeBase64(identity.signingPublicKey),
    name,
    addr: address,
    fp: shortFingerprint(identity.publicKey),
    exp: Date.now() + INVITE_TTL_MS,
  };

  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const signature = nacl.sign.detached(payloadBytes, identity.signingSecretKey);

  const envelope = {
    payload: encodeBase64(payloadBytes),
    sig: encodeBase64(signature),
  };

  const encoded = Buffer.from(JSON.stringify(envelope)).toString('base64url');
  return `amp://invite/${encoded}`;
}

export function parseInvite(inviteCode: string): InvitePayload {
  const prefix = 'amp://invite/';
  if (!inviteCode.startsWith(prefix)) {
    throw new Error('Invalid invite code — must start with amp://invite/');
  }

  const encoded = inviteCode.slice(prefix.length);
  const envelope = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as {
    payload: string;
    sig: string;
  };

  const payloadBytes = decodeBase64(envelope.payload);
  const signature = decodeBase64(envelope.sig);
  const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as InvitePayload;

  if (payload.v !== 1) {
    throw new Error(`Unsupported invite version: ${payload.v}`);
  }

  if (Date.now() > payload.exp) {
    throw new Error('Invite expired');
  }

  const signingKey = decodeBase64(payload.sk);
  const isValid = nacl.sign.detached.verify(payloadBytes, signature, signingKey);
  if (!isValid) {
    throw new Error('Invalid invite signature — possibly tampered');
  }

  return payload;
}
