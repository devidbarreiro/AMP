import { default as BonjourModule } from 'bonjour-service';
import { ensureIdentity, fingerprint } from '../crypto/identity.js';
import util from 'tweetnacl-util';
const { encodeBase64 } = util;

const SERVICE_TYPE = 'amp';
const SERVICE_NAME_PREFIX = 'amp-';

interface DiscoveredPeer {
  name: string;
  host: string;
  port: number;
  publicKey: string;
  fingerprint: string;
}

type PeerCallback = (peer: DiscoveredPeer) => void;

let bonjourInstance: unknown | null = null;
let publishedService: unknown | null = null;

export function startDiscovery(port: number, onPeerFound: PeerCallback): void {
  const identity = ensureIdentity();
  const pk = encodeBase64(identity.publicKey);
  const fp = fingerprint(identity.publicKey).slice(0, 8);

  // @ts-expect-error — bonjour-service default export is a class
  bonjourInstance = new BonjourModule();

  const bonjour = bonjourInstance as { publish: Function; find: Function; destroy: Function };

  // Publish our service
  publishedService = bonjour.publish({
    name: `${SERVICE_NAME_PREFIX}${fp}`,
    type: SERVICE_TYPE,
    port,
    txt: {
      pk: pk.slice(0, 20),
      fp,
      v: '0.1',
    },
  });

  console.log(`[mdns] Publishing as ${SERVICE_NAME_PREFIX}${fp} on port ${port}`);

  // Browse for peers
  const browser = bonjour.find({ type: SERVICE_TYPE });

  browser.on('up', (service: Record<string, unknown>) => {
    const txt = service.txt as Record<string, string> | undefined;
    const peerFp = txt?.fp;
    const peerPkPrefix = txt?.pk;

    if (peerFp === fp) return;

    const host = (service.host as string) || (service.referer as Record<string, string>)?.address;
    if (!host) return;

    const peer: DiscoveredPeer = {
      name: (service.name as string || '').replace(SERVICE_NAME_PREFIX, ''),
      host,
      port: service.port as number,
      publicKey: peerPkPrefix || '',
      fingerprint: peerFp || '',
    };

    console.log(`[mdns] Discovered peer: ${peer.fingerprint} at ${peer.host}:${peer.port}`);
    onPeerFound(peer);
  });

  browser.on('down', (service: Record<string, unknown>) => {
    const txt = service.txt as Record<string, string> | undefined;
    const peerFp = txt?.fp;
    if (peerFp && peerFp !== fp) {
      console.log(`[mdns] Peer went offline: ${peerFp}`);
    }
  });
}

export function stopDiscovery(): void {
  if (publishedService) {
    (publishedService as { stop?: Function }).stop?.();
    publishedService = null;
  }
  if (bonjourInstance) {
    (bonjourInstance as { destroy: Function }).destroy();
    bonjourInstance = null;
  }
}
