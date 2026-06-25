import { getPendingOutbound, markDelivered, markFailed, type Message } from '../store/inbox.js';
import { getPeer, listPeers, updatePeerSeen } from '../contacts/peers.js';
import { ensureIdentity } from '../crypto/identity.js';
import { encryptForPeer } from '../crypto/encryption.js';
import util from 'tweetnacl-util';
const { encodeBase64, decodeBase64 } = util;

const DELIVERY_INTERVAL_MS = 5_000;
const MAX_RETRIES = 10;

let deliveryTimer: ReturnType<typeof setInterval> | null = null;

interface PeerAddress {
  alias: string;
  host: string;
  port: number;
}

const knownAddresses = new Map<string, PeerAddress>();

export function registerPeerAddress(alias: string, host: string, port: number): void {
  knownAddresses.set(alias, { alias, host, port });
}

export function startDeliveryLoop(): void {
  if (deliveryTimer) return;

  console.log(`[delivery] Starting delivery loop (every ${DELIVERY_INTERVAL_MS / 1000}s)`);

  deliveryTimer = setInterval(async () => {
    try {
      await deliverPendingMessages();
    } catch (err) {
      console.error('[delivery] Error in delivery loop:', (err as Error).message);
    }
  }, DELIVERY_INTERVAL_MS);

  // Run once immediately
  deliverPendingMessages().catch(() => {});
}

export function stopDeliveryLoop(): void {
  if (deliveryTimer) {
    clearInterval(deliveryTimer);
    deliveryTimer = null;
  }
}

async function deliverPendingMessages(): Promise<void> {
  const pending = getPendingOutbound();
  if (pending.length === 0) return;

  const identity = ensureIdentity();

  const byPeer = new Map<string, Message[]>();
  for (const msg of pending) {
    if (msg.retryCount >= MAX_RETRIES) {
      markFailed(msg.id, `Max retries (${MAX_RETRIES}) exceeded`);
      continue;
    }
    const list = byPeer.get(msg.toPeer) ?? [];
    list.push(msg);
    byPeer.set(msg.toPeer, list);
  }

  for (const [peerAlias, messages] of byPeer) {
    const addr = knownAddresses.get(peerAlias);
    const peer = getPeer(peerAlias);

    if (!peer) {
      for (const msg of messages) {
        markFailed(msg.id, 'Peer not found in contacts');
      }
      continue;
    }

    // Try known address first, then last seen address
    const targetHost = addr?.host ?? extractHost(peer.lastAddress);
    const targetPort = addr?.port ?? extractPort(peer.lastAddress) ?? 9800;

    if (!targetHost) continue; // No known address, skip this round

    for (const msg of messages) {
      try {
        await deliverMessage(msg, peer.publicKey, identity.secretKey, targetHost, targetPort);
        markDelivered(msg.id);
        updatePeerSeen(peerAlias, `${targetHost}:${targetPort}`);
      } catch {
        // Silent retry next round — don't mark as failed for transient errors
      }
    }
  }
}

async function deliverMessage(
  msg: Message,
  recipientPublicKey: string,
  senderSecretKey: Uint8Array,
  host: string,
  port: number,
): Promise<void> {
  const payload = JSON.stringify({
    type: 'message',
    id: msg.id,
    content: msg.content,
    fileName: msg.fileName,
    timestamp: Date.now(),
  });

  const plaintext = new TextEncoder().encode(payload);
  const recipientPk = decodeBase64(recipientPublicKey);
  const envelope = encryptForPeer(plaintext, recipientPk, senderSecretKey);

  const response = await fetch(`http://${host}:${port}/amp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      envelope,
      senderPublicKey: encodeBase64(
        (await import('tweetnacl')).default.box.keyPair.fromSecretKey(senderSecretKey).publicKey,
      ),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `HTTP ${response.status}`);
  }
}

function extractHost(addr: string | null): string | null {
  if (!addr) return null;
  const parts = addr.split(':');
  return parts.slice(0, -1).join(':') || parts[0];
}

function extractPort(addr: string | null): number | null {
  if (!addr) return null;
  const parts = addr.split(':');
  const port = parseInt(parts[parts.length - 1], 10);
  return isNaN(port) ? null : port;
}
