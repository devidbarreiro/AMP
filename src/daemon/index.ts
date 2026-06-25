#!/usr/bin/env node

import { startDaemon } from './server.js';
import { startDiscovery, stopDiscovery } from '../transport/mdns.js';
import { startDeliveryLoop, stopDeliveryLoop, registerPeerAddress } from '../transport/delivery.js';
import { startTailscaleDiscovery, stopTailscaleDiscovery } from '../transport/tailscale.js';
import { startStunDiscovery, stopStunDiscovery } from '../transport/stun.js';

const port = parseInt(process.env.AMP_PORT || '9800', 10);

startDaemon({ port });

// Layer 1: LAN discovery (instant, zero-config)
startDiscovery(port, (peer) => {
  registerPeerAddress(peer.fingerprint, peer.host, peer.port);
});

// Layer 2: Tailscale discovery (if installed)
startTailscaleDiscovery();

// Layer 3: STUN public address discovery (for hole-punching)
startStunDiscovery();

startDeliveryLoop();

const shutdown = () => {
  stopDiscovery();
  stopTailscaleDiscovery();
  stopStunDiscovery();
  stopDeliveryLoop();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
