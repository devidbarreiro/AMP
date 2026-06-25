import { startDaemon } from './server.js';

const port = parseInt(process.env.AMP_PORT || '9800', 10);
startDaemon({ port });
