#!/usr/bin/env node

import { startDaemon } from './server.js';
import { startDiscovery, stopDiscovery } from '../transport/mdns.js';
import { startDeliveryLoop, stopDeliveryLoop, registerPeerAddress } from '../transport/delivery.js';

const port = parseInt(process.env.AMP_PORT || '9800', 10);

startDaemon({ port });

startDiscovery(port, (peer) => {
  registerPeerAddress(peer.fingerprint, peer.host, peer.port);
});

startDeliveryLoop();

process.on('SIGTERM', () => { stopDiscovery(); stopDeliveryLoop(); process.exit(0); });
process.on('SIGINT', () => { stopDiscovery(); stopDeliveryLoop(); process.exit(0); });
