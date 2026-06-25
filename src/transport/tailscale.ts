import { execSync } from 'node:child_process';
import { listPeers, updatePeerSeen } from '../contacts/peers.js';
import { registerPeerAddress } from './delivery.js';

interface TailscaleNode {
  name: string;
  ipv4: string;
  online: boolean;
}

function getTailscaleStatus(): TailscaleNode[] {
  try {
    const output = execSync('tailscale status --json', { encoding: 'utf-8', timeout: 5000 });
    const status = JSON.parse(output) as {
      Peer?: Record<string, {
        HostName?: string;
        TailscaleIPs?: string[];
        Online?: boolean;
        DNSName?: string;
      }>;
      Self?: {
        HostName?: string;
        TailscaleIPs?: string[];
        DNSName?: string;
      };
    };

    const nodes: TailscaleNode[] = [];

    if (status.Peer) {
      for (const [, peer] of Object.entries(status.Peer)) {
        const ipv4 = peer.TailscaleIPs?.find(ip => ip.includes('.'));
        if (ipv4 && peer.HostName) {
          nodes.push({
            name: peer.HostName.toLowerCase(),
            ipv4,
            online: peer.Online ?? false,
          });
        }
      }
    }

    return nodes;
  } catch {
    return [];
  }
}

export function resolveTailscalePeers(): void {
  const tsNodes = getTailscaleStatus();
  if (tsNodes.length === 0) return;

  const peers = listPeers();

  for (const peer of peers) {
    const alias = peer.alias.toLowerCase();
    const displayName = (peer.displayName ?? '').toLowerCase();

    const match = tsNodes.find(n =>
      n.online && (
        alias.includes(n.name) ||
        n.name.includes(alias) ||
        displayName.includes(n.name) ||
        n.name.includes(displayName.replace(/\s+/g, '-'))
      )
    );

    if (match) {
      const addr = `${match.ipv4}:9800`;
      if (peer.lastAddress !== addr) {
        console.log(`[tailscale] Resolved ${peer.alias} → ${addr}`);
        updatePeerSeen(peer.alias, addr);
        registerPeerAddress(peer.alias, match.ipv4, 9800);
      }
    }
  }
}

const TAILSCALE_INTERVAL_MS = 30_000;
let tailscaleTimer: ReturnType<typeof setInterval> | null = null;

export function startTailscaleDiscovery(): void {
  if (tailscaleTimer) return;

  resolveTailscalePeers();

  tailscaleTimer = setInterval(() => {
    resolveTailscalePeers();
  }, TAILSCALE_INTERVAL_MS);

  console.log('[tailscale] Discovery active (every 30s)');
}

export function stopTailscaleDiscovery(): void {
  if (tailscaleTimer) {
    clearInterval(tailscaleTimer);
    tailscaleTimer = null;
  }
}
