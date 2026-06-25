import util from 'tweetnacl-util';
const { encodeBase64, decodeBase64 } = util;
import { getDb } from '../store/database.js';
import { fingerprint } from '../crypto/identity.js';

export interface Peer {
  alias: string;
  displayName: string | null;
  publicKey: string;
  signingKey: string;
  fingerprint: string;
  status: 'pending' | 'active' | 'blocked';
  lastSeen: string | null;
  lastAddress: string | null;
  permissions: PeerPermissions;
  addedAt: string;
  notes: string | null;
}

export interface PeerPermissions {
  text: boolean;
  files: boolean;
  maxFileSize: number;
}

const DEFAULT_PERMISSIONS: PeerPermissions = {
  text: true,
  files: true,
  maxFileSize: 500 * 1024 * 1024,
};

export function addPeer(
  alias: string,
  publicKey: Uint8Array,
  signingKey: Uint8Array,
  displayName?: string,
): void {
  const db = getDb();
  const fp = fingerprint(publicKey);

  db.prepare(`
    INSERT OR REPLACE INTO peers (alias, display_name, public_key, signing_key, fingerprint, status, permissions)
    VALUES (?, ?, ?, ?, ?, 'active', ?)
  `).run(
    alias,
    displayName ?? null,
    encodeBase64(publicKey),
    encodeBase64(signingKey),
    fp,
    JSON.stringify(DEFAULT_PERMISSIONS),
  );
}

export function getPeer(alias: string): Peer | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM peers WHERE alias = ?').get(alias) as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapPeerRow(row);
}

export function getPeerByPublicKey(publicKey: string): Peer | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM peers WHERE public_key = ?').get(publicKey) as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapPeerRow(row);
}

export function listPeers(includeBlocked = false): Peer[] {
  const db = getDb();
  const query = includeBlocked
    ? 'SELECT * FROM peers ORDER BY alias'
    : "SELECT * FROM peers WHERE status != 'blocked' ORDER BY alias";
  return (db.prepare(query).all() as Record<string, unknown>[]).map(mapPeerRow);
}

export function updatePeerSeen(alias: string, address: string): void {
  const db = getDb();
  db.prepare(`
    UPDATE peers SET last_seen = datetime('now'), last_address = ?
    WHERE alias = ?
  `).run(address, alias);
}

export function blockPeer(alias: string): void {
  const db = getDb();
  db.prepare("UPDATE peers SET status = 'blocked' WHERE alias = ?").run(alias);
}

export function removePeer(alias: string): void {
  const db = getDb();
  db.prepare('DELETE FROM peers WHERE alias = ?').run(alias);
}

export function getPeerPublicKey(alias: string): Uint8Array | null {
  const peer = getPeer(alias);
  if (!peer) return null;
  return decodeBase64(peer.publicKey);
}

function mapPeerRow(row: Record<string, unknown>): Peer {
  return {
    alias: row.alias as string,
    displayName: row.display_name as string | null,
    publicKey: row.public_key as string,
    signingKey: row.signing_key as string,
    fingerprint: row.fingerprint as string,
    status: row.status as Peer['status'],
    lastSeen: row.last_seen as string | null,
    lastAddress: row.last_address as string | null,
    permissions: JSON.parse((row.permissions as string) || '{}') as PeerPermissions,
    addedAt: row.added_at as string,
    notes: row.notes as string | null,
  };
}
