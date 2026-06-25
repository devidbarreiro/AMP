import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { ensureIdentity, fingerprint } from '../crypto/identity.js';
import { receiveInbound, getPendingOutbound, markDelivered, getInboxStats } from '../store/inbox.js';
import { getPeerByPublicKey, updatePeerSeen, listPeers } from '../contacts/peers.js';
import { verifySignature } from '../crypto/identity.js';
import { decryptFromPeer, type EncryptedEnvelope } from '../crypto/encryption.js';
import { getDb } from '../store/database.js';
import util from 'tweetnacl-util';
const { encodeBase64, decodeBase64 } = util;

export interface DaemonConfig {
  port: number;
  host: string;
}

const DEFAULT_CONFIG: DaemonConfig = { port: 9800, host: '0.0.0.0' };

interface AmpMessage {
  type: 'message';
  id: string;
  from: string;
  content?: string;
  fileName?: string;
  fileData?: string;
  timestamp: number;
  signature: string;
}

interface AmpDrainRequest {
  type: 'drain';
  publicKey: string;
}

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export function startDaemon(config: Partial<DaemonConfig> = {}): void {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const identity = ensureIdentity();
  getDb();

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

    // Agent Card — discovery endpoint
    if (req.method === 'GET' && url.pathname === '/.well-known/agent-card.json') {
      json(res, 200, {
        name: process.env.AMP_NAME || hostname(),
        protocol: 'amp',
        version: '0.1.0',
        publicKey: encodeBase64(identity.publicKey),
        signingKey: encodeBase64(identity.signingPublicKey),
        fingerprint: fingerprint(identity.publicKey),
        capabilities: ['text', 'files'],
      });
      return;
    }

    // Health check
    if (req.method === 'GET' && url.pathname === '/health') {
      const stats = getInboxStats();
      const peers = listPeers();
      json(res, 200, { status: 'ok', ...stats, peers: peers.length });
      return;
    }

    // Receive message from peer
    if (req.method === 'POST' && url.pathname === '/amp/send') {
      try {
        const body = JSON.parse(await parseBody(req));
        const envelope = body.envelope as EncryptedEnvelope;
        const senderPk = body.senderPublicKey as string;

        const peer = getPeerByPublicKey(senderPk);
        if (!peer) {
          json(res, 403, { error: 'Unknown peer — not in contacts' });
          return;
        }
        if (peer.status === 'blocked') {
          json(res, 403, { error: 'Blocked' });
          return;
        }

        const plaintext = decryptFromPeer(envelope, identity.secretKey);
        const message = JSON.parse(new TextDecoder().decode(plaintext)) as AmpMessage;

        const id = receiveInbound(
          peer.alias,
          message.content ?? '',
          undefined,
          message.fileName,
          message.fileData ? Buffer.from(message.fileData, 'base64').length : undefined,
        );

        const addr = `${req.socket.remoteAddress}:${req.socket.remotePort}`;
        updatePeerSeen(peer.alias, addr);

        json(res, 200, { received: true, id });
      } catch (err) {
        json(res, 400, { error: (err as Error).message });
      }
      return;
    }

    // Drain — peer asks for queued messages
    if (req.method === 'POST' && url.pathname === '/amp/drain') {
      try {
        const body = JSON.parse(await parseBody(req)) as AmpDrainRequest;
        const peer = getPeerByPublicKey(body.publicKey);
        if (!peer) {
          json(res, 403, { error: 'Unknown peer' });
          return;
        }

        const pending = getPendingOutbound(peer.alias);
        for (const msg of pending) {
          markDelivered(msg.id);
        }

        const addr = `${req.socket.remoteAddress}:${req.socket.remotePort}`;
        updatePeerSeen(peer.alias, addr);

        json(res, 200, {
          messages: pending.map(m => ({
            id: m.id,
            content: m.content,
            fileName: m.fileName,
            createdAt: m.createdAt,
          })),
        });
      } catch (err) {
        json(res, 400, { error: (err as Error).message });
      }
      return;
    }

    json(res, 404, { error: 'Not found' });
  });

  server.listen(cfg.port, cfg.host, () => {
    const fp = fingerprint(identity.publicKey);
    console.log(`AMP daemon listening on ${cfg.host}:${cfg.port}`);
    console.log(`Identity: ${fp}`);
  });

  process.on('SIGTERM', () => {
    server.close();
    process.exit(0);
  });
  process.on('SIGINT', () => {
    server.close();
    process.exit(0);
  });
}
