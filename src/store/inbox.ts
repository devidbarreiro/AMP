import { randomUUID } from 'node:crypto';
import { getDb } from './database.js';

export interface Message {
  id: string;
  fromPeer: string;
  toPeer: string;
  content: string | null;
  filePath: string | null;
  fileName: string | null;
  fileSize: number | null;
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'delivered' | 'read' | 'failed';
  priority: number;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  retryCount: number;
  error: string | null;
}

export function queueOutbound(toPeer: string, content: string, filePath?: string, fileName?: string, fileSize?: number): string {
  const db = getDb();
  const id = randomUUID();
  db.prepare(`
    INSERT INTO messages (id, from_peer, to_peer, content, file_path, file_name, file_size, direction, status)
    VALUES (?, 'self', ?, ?, ?, ?, ?, 'outbound', 'pending')
  `).run(id, toPeer, content, filePath ?? null, fileName ?? null, fileSize ?? null);
  return id;
}

export function receiveInbound(fromPeer: string, content: string, filePath?: string, fileName?: string, fileSize?: number): string {
  const db = getDb();
  const id = randomUUID();
  db.prepare(`
    INSERT INTO messages (id, from_peer, to_peer, content, file_path, file_name, file_size, direction, status)
    VALUES (?, ?, 'self', ?, ?, ?, ?, 'inbound', 'delivered')
  `).run(id, fromPeer, content, filePath ?? null, fileName ?? null, fileSize ?? null);
  return id;
}

export function getUnreadInbox(): Message[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM messages
    WHERE direction = 'inbound' AND status IN ('delivered', 'pending')
    ORDER BY priority DESC, created_at DESC
  `).all() as Message[];
}

export function getAllInbox(limit = 50): Message[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM messages
    WHERE direction = 'inbound'
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit) as Message[];
}

export function markAsRead(id: string): void {
  const db = getDb();
  db.prepare(`
    UPDATE messages SET status = 'read', read_at = datetime('now')
    WHERE id = ? AND direction = 'inbound'
  `).run(id);
}

export function getPendingOutbound(toPeer?: string): Message[] {
  const db = getDb();
  if (toPeer) {
    return db.prepare(`
      SELECT * FROM messages
      WHERE direction = 'outbound' AND status = 'pending' AND to_peer = ?
      ORDER BY priority DESC, created_at ASC
    `).all(toPeer) as Message[];
  }
  return db.prepare(`
    SELECT * FROM messages
    WHERE direction = 'outbound' AND status = 'pending'
    ORDER BY priority DESC, created_at ASC
  `).all() as Message[];
}

export function markDelivered(id: string): void {
  const db = getDb();
  db.prepare(`
    UPDATE messages SET status = 'delivered', delivered_at = datetime('now')
    WHERE id = ? AND direction = 'outbound'
  `).run(id);
}

export function markFailed(id: string, error: string): void {
  const db = getDb();
  db.prepare(`
    UPDATE messages SET status = 'failed', error = ?, retry_count = retry_count + 1
    WHERE id = ?
  `).run(error, id);
}

export function resetForRetry(id: string): void {
  const db = getDb();
  db.prepare(`
    UPDATE messages SET status = 'pending', error = NULL
    WHERE id = ? AND status = 'failed'
  `).run(id);
}

export function deleteMessage(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM messages WHERE id = ?').run(id);
}

export function getInboxStats(): { unread: number; total: number; pendingOutbound: number } {
  const db = getDb();
  const unread = (db.prepare(`SELECT COUNT(*) as c FROM messages WHERE direction = 'inbound' AND status IN ('delivered', 'pending')`).get() as { c: number }).c;
  const total = (db.prepare(`SELECT COUNT(*) as c FROM messages WHERE direction = 'inbound'`).get() as { c: number }).c;
  const pendingOutbound = (db.prepare(`SELECT COUNT(*) as c FROM messages WHERE direction = 'outbound' AND status = 'pending'`).get() as { c: number }).c;
  return { unread, total, pendingOutbound };
}
