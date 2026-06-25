import { createSocket, type Socket } from 'node:dgram';
import { listPeers, updatePeerSeen } from '../contacts/peers.js';
import { registerPeerAddress } from './delivery.js';

const STUN_SERVERS = [
  'stun.l.google.com:19302',
  'stun1.l.google.com:19302',
  'stun2.l.google.com:19302',
];

const STUN_BINDING_REQUEST = Buffer.from([
  0x00, 0x01, // Binding Request
  0x00, 0x00, // Message Length
  0x21, 0x12, 0xa4, 0x42, // Magic Cookie
  // Transaction ID (12 bytes random)
  ...Array.from({ length: 12 }, () => Math.floor(Math.random() * 256)),
]);

interface StunResult {
  publicIp: string;
  publicPort: number;
}

export async function discoverPublicAddress(): Promise<StunResult | null> {
  for (const server of STUN_SERVERS) {
    try {
      const result = await queryStun(server);
      if (result) return result;
    } catch {
      continue;
    }
  }
  return null;
}

function queryStun(server: string): Promise<StunResult | null> {
  return new Promise((resolve) => {
    const [host, portStr] = server.split(':');
    const port = parseInt(portStr, 10);
    const socket = createSocket('udp4');
    const timeout = setTimeout(() => {
      socket.close();
      resolve(null);
    }, 3000);

    socket.on('message', (msg) => {
      clearTimeout(timeout);
      const result = parseStunResponse(msg);
      socket.close();
      resolve(result);
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      socket.close();
      resolve(null);
    });

    socket.send(STUN_BINDING_REQUEST, port, host);
  });
}

function parseStunResponse(msg: Buffer): StunResult | null {
  if (msg.length < 20) return null;

  const msgType = msg.readUInt16BE(0);
  if (msgType !== 0x0101) return null; // Not a Binding Response

  const msgLength = msg.readUInt16BE(2);
  let offset = 20; // Skip header

  while (offset < 20 + msgLength) {
    const attrType = msg.readUInt16BE(offset);
    const attrLength = msg.readUInt16BE(offset + 2);
    offset += 4;

    // XOR-MAPPED-ADDRESS (0x0020) — preferred
    if (attrType === 0x0020 && attrLength >= 8) {
      const family = msg[offset + 1];
      if (family === 0x01) { // IPv4
        const xorPort = msg.readUInt16BE(offset + 2) ^ 0x2112;
        const xorIp = msg.readUInt32BE(offset + 4) ^ 0x2112a442;
        const ip = [
          (xorIp >>> 24) & 0xff,
          (xorIp >>> 16) & 0xff,
          (xorIp >>> 8) & 0xff,
          xorIp & 0xff,
        ].join('.');
        return { publicIp: ip, publicPort: xorPort };
      }
    }

    // MAPPED-ADDRESS (0x0001) — fallback
    if (attrType === 0x0001 && attrLength >= 8) {
      const family = msg[offset + 1];
      if (family === 0x01) {
        const mappedPort = msg.readUInt16BE(offset + 2);
        const ip = [msg[offset + 4], msg[offset + 5], msg[offset + 6], msg[offset + 7]].join('.');
        return { publicIp: ip, publicPort: mappedPort };
      }
    }

    offset += attrLength;
    // Pad to 4-byte boundary
    if (attrLength % 4 !== 0) offset += 4 - (attrLength % 4);
  }

  return null;
}

// Hole-punching: both peers send UDP packets to each other's public address.
// The NAT sees outgoing traffic and opens a pinhole for the return path.
export function punchHole(
  socket: Socket,
  targetIp: string,
  targetPort: number,
  localPort: number,
): Promise<boolean> {
  return new Promise((resolve) => {
    const punch = Buffer.from(JSON.stringify({ type: 'amp-punch', port: localPort }));
    let attempts = 0;
    const maxAttempts = 5;

    const interval = setInterval(() => {
      attempts++;
      socket.send(punch, targetPort, targetIp);
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        resolve(false);
      }
    }, 500);

    socket.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'amp-punch' && rinfo.address === targetIp) {
          clearInterval(interval);
          resolve(true);
        }
      } catch {
        // not a punch packet
      }
    });

    setTimeout(() => {
      clearInterval(interval);
      resolve(false);
    }, 5000);
  });
}

let stunTimer: ReturnType<typeof setInterval> | null = null;
let lastPublicAddress: StunResult | null = null;

export function getLastPublicAddress(): StunResult | null {
  return lastPublicAddress;
}

export async function startStunDiscovery(): Promise<void> {
  const result = await discoverPublicAddress();
  if (result) {
    lastPublicAddress = result;
    console.log(`[stun] Public address: ${result.publicIp}:${result.publicPort}`);
  } else {
    console.log('[stun] Could not determine public address');
  }

  // Re-check every 5 minutes (public IP can change)
  stunTimer = setInterval(async () => {
    const updated = await discoverPublicAddress();
    if (updated) {
      if (!lastPublicAddress || lastPublicAddress.publicIp !== updated.publicIp) {
        console.log(`[stun] Public address updated: ${updated.publicIp}:${updated.publicPort}`);
      }
      lastPublicAddress = updated;
    }
  }, 5 * 60 * 1000);
}

export function stopStunDiscovery(): void {
  if (stunTimer) {
    clearInterval(stunTimer);
    stunTimer = null;
  }
}
