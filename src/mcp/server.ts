import { ensureIdentity, fingerprint } from '../crypto/identity.js';
import { getDb } from '../store/database.js';
import { queueOutbound, getUnreadInbox, getAllInbox, markAsRead, getInboxStats } from '../store/inbox.js';
import { listPeers, getPeer } from '../contacts/peers.js';
import { hostname } from 'node:os';

interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

interface McpRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface McpResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string };
}

const TOOLS: McpTool[] = [
  {
    name: 'amp_send',
    description: 'Send a message to a peer via AMP. The message will be delivered when the peer is online, or queued if offline.',
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Peer alias (contact name)' },
        message: { type: 'string', description: 'Message content' },
        file: { type: 'string', description: 'Optional file path to attach' },
      },
      required: ['to', 'message'],
    },
  },
  {
    name: 'amp_inbox',
    description: 'Check the AMP inbox for new messages from other agents/peers.',
    inputSchema: {
      type: 'object',
      properties: {
        all: { type: 'boolean', description: 'Show all messages, not just unread' },
      },
    },
  },
  {
    name: 'amp_read',
    description: 'Read a specific AMP message by ID prefix and mark it as read.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Message ID or prefix' },
      },
      required: ['id'],
    },
  },
  {
    name: 'amp_reply',
    description: 'Reply to an AMP message.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Message ID to reply to' },
        message: { type: 'string', description: 'Reply content' },
      },
      required: ['id', 'message'],
    },
  },
  {
    name: 'amp_peers',
    description: 'List AMP contacts/peers with their online status.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'amp_status',
    description: 'Show AMP node status — identity, peer count, inbox stats.',
    inputSchema: { type: 'object', properties: {} },
  },
];

function handleToolCall(name: string, args: Record<string, unknown>): unknown {
  ensureIdentity();
  getDb();

  switch (name) {
    case 'amp_send': {
      const to = args.to as string;
      const message = args.message as string;
      const peer = getPeer(to);
      if (!peer) return { error: `Peer "${to}" not found. Use amp_peers to see contacts.` };
      const id = queueOutbound(to, message);
      return { sent: true, id, to, message, queued: !peer.lastSeen };
    }

    case 'amp_inbox': {
      const all = args.all as boolean | undefined;
      const messages = all ? getAllInbox() : getUnreadInbox();
      return {
        count: messages.length,
        messages: messages.map(m => ({
          id: m.id.slice(0, 8),
          from: m.fromPeer,
          content: m.content?.slice(0, 200),
          file: m.fileName ?? undefined,
          date: m.createdAt,
          unread: m.status !== 'read',
        })),
      };
    }

    case 'amp_read': {
      const prefix = args.id as string;
      const messages = getAllInbox();
      const msg = messages.find(m => m.id.startsWith(prefix));
      if (!msg) return { error: 'Message not found' };
      markAsRead(msg.id);
      return {
        id: msg.id,
        from: msg.fromPeer,
        content: msg.content,
        file: msg.fileName ?? undefined,
        date: msg.createdAt,
      };
    }

    case 'amp_reply': {
      const replyId = args.id as string;
      const message = args.message as string;
      const messages = getAllInbox();
      const original = messages.find(m => m.id.startsWith(replyId));
      if (!original) return { error: 'Original message not found' };
      const id = queueOutbound(original.fromPeer, message);
      return { sent: true, id, to: original.fromPeer, inReplyTo: replyId };
    }

    case 'amp_peers': {
      const peers = listPeers();
      return {
        count: peers.length,
        peers: peers.map(p => ({
          alias: p.alias,
          name: p.displayName,
          status: p.status,
          online: p.lastSeen ? Date.now() - new Date(p.lastSeen).getTime() < 60_000 : false,
          lastSeen: p.lastSeen,
        })),
      };
    }

    case 'amp_status': {
      const identity = ensureIdentity();
      const stats = getInboxStats();
      const peers = listPeers();
      return {
        node: hostname(),
        fingerprint: fingerprint(identity.publicKey),
        peers: peers.length,
        inbox: stats.unread,
        outbox: stats.pendingOutbound,
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export function startMcpServer(): void {
  ensureIdentity();
  getDb();

  let buffer = '';

  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const req = JSON.parse(line) as McpRequest;
        const response = handleRequest(req);
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch {
        // skip malformed lines
      }
    }
  });
}

function handleRequest(req: McpRequest): McpResponse {
  switch (req.method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'amp-mcp', version: '0.1.0' },
        },
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id: req.id,
        result: { tools: TOOLS },
      };

    case 'tools/call': {
      const params = req.params as { name: string; arguments?: Record<string, unknown> };
      const result = handleToolCall(params.name, params.arguments ?? {});
      return {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        },
      };
    }

    case 'notifications/initialized':
      return { jsonrpc: '2.0', id: req.id, result: {} };

    default:
      return {
        jsonrpc: '2.0',
        id: req.id,
        error: { code: -32601, message: `Method not found: ${req.method}` },
      };
  }
}
