import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chat, streamChat } from './lib/api-handler.js';
import guestHandler from '../api/guest.js';
import authHandler from '../api/auth.js';
import healthHandler from '../api/health.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '8mb' }));

app.get('/', (_req, res) => res.sendFile(path.join(root, 'index.html')));
app.get('/styles.css', (_req, res) => res.sendFile(path.join(root, 'styles.css')));
app.get('/app.js', (_req, res) => res.sendFile(path.join(root, 'app.js')));
app.get('/favicon.svg', (_req, res) => res.sendFile(path.join(root, 'favicon.svg')));
app.get('/health', (_req, res) => healthHandler(_req, res));
app.get('/api/health', (_req, res) => healthHandler(_req, res));
app.post('/api/guest', (req, res) => guestHandler(req, res));
app.post('/api/auth', (req, res) => authHandler(req, res));
app.post('/api/chat', chat);
app.post('/v1/chat', chat);
app.post('/v1/chat/stream', streamChat);

app.use((err, _req, res, _next) => {
  if (res.headersSent) return;
  const status = err?.type === 'entity.too.large' ? 413 : 400;
  res.status(status).json({ success: false, error: status === 413 ? 'Request body too large' : 'Invalid JSON request' });
});

const server = app.listen(port, () => console.log(`WINE AI listening on http://localhost:${port}`));
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;
