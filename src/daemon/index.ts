#!/usr/bin/env node

import { startDaemon } from './server.js';
import { startDiscovery, stopDiscovery } from '../transport/mdns.js';
import { startDeliveryLoop, stopDeliveryLoop, registerPeerAddress } from '../transport/delivery.js';
import { startTailscaleDiscovery, stopTailscaleDiscovery } from '../transport/tailscale.js';

const port = parseInt(process.env.AMP_PORT || '9800', 10);

startDaemon({ port });

// LAN discovery
startDiscovery(port, (peer) => {
  registerPeerAddress(peer.fingerprint, peer.host, peer.port);
});

// WAN discovery via Tailscale (if available)
startTailscaleDiscovery();

startDeliveryLoop();

const shutdown = () => { stopDiscovery(); stopTailscaleDiscovery(); stopDeliveryLoop(); process.exit(0); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
