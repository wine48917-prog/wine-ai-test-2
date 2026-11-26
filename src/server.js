import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chat, streamChat } from './lib/api-handler.js';
import guestHandler from '../api/guest.js';
import authHandler from '../api/auth.js';
import healthHandler from '../api/health.js';
import ownerHandler from '../api/owner.js';
import studioHandler from '../api/studio.js';
import starXImageHandler from '../api/star-x-image.js';
import workspaceHandler from '../api/workspace.js';
import controlHandler from '../api/control.js';
import { maintenanceGuard } from './lib/site-control.js';
import { recordSiteVisit } from '../db.js';
import analyticsHandler from '../api/analytics.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '8mb' }));
app.use(async (req,res,next)=>{if(req.path==='/developer'||req.path==='/api/owner'||req.path==='/api/control'||req.path==='/api/health'||req.path==='/health'||req.path==='/api/analytics')return next();if(await maintenanceGuard(req,res))return;return next();});
app.use(async (req,res,next)=>{if(req.method==='GET'&&['/','/chat','/studio'].includes(req.path)){try{await recordSiteVisit(req,res)}catch(e){console.error('[analytics visit]',e.message)}}next();});

// Static assets are served directly with short-lived caching; HTML stays fresh.
app.get('/chat', workspaceHandler);
app.get('/developer', ownerHandler);
app.get('/', (_req, res) => res.sendFile(path.join(root, 'index.html'), {
  headers: { 'Cache-Control': 'no-cache' }
}));
app.get('/guide', (_req, res) => res.sendFile(path.join(root, 'pages/guide.html'), { headers: { 'Cache-Control': 'no-cache' } }));
app.get('/features', (_req, res) => res.sendFile(path.join(root, 'pages/features.html'), { headers: { 'Cache-Control': 'no-cache' } }));
app.get('/chat-info', (_req, res) => res.sendFile(path.join(root, 'pages/chat.html'), { headers: { 'Cache-Control': 'no-cache' } }));
app.get('/studio-info', (_req, res) => res.sendFile(path.join(root, 'pages/studio.html'), { headers: { 'Cache-Control': 'no-cache' } }));
app.get('/about', (_req, res) => res.sendFile(path.join(root, 'pages/about.html'), { headers: { 'Cache-Control': 'no-cache' } }));
app.get('/styles.css', (_req, res) => res.sendFile(path.join(root, 'styles.css'), {
  headers: { 'Cache-Control': 'public, max-age=3600' }
}));
app.get('/app.js', (_req, res) => res.sendFile(path.join(root, 'app.js'), {
  headers: { 'Cache-Control': 'public, max-age=3600' }
}));
app.get('/studio.js', (_req, res) => res.sendFile(path.join(root, 'studio.js'), {
  headers: { 'Cache-Control': 'public, max-age=3600' }
}));
app.get('/favicon.svg', (_req, res) => res.sendFile(path.join(root, 'favicon.svg')));
app.get('/icon.png', (_req, res) => res.sendFile(path.join(root, 'icon.png')));

// Keep the creative studio and owner workspace on the same Express runtime.
app.get(['/studio', '/api/studio'], studioHandler);
app.route('/api/owner').get(ownerHandler).post(ownerHandler);
app.route('/api/control').get(controlHandler).post(controlHandler);
app.get('/api/analytics', analyticsHandler);
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.post('/api/guest', guestHandler);
app.post('/api/auth', authHandler);
app.post('/api/star-x-image', starXImageHandler);
app.post('/api/chat', chat);
app.post('/v1/chat', chat);
app.post('/v1/chat/stream', streamChat);

app.use((err, _req, res, _next) => {
  console.error('[express]', err?.stack || err);
  if (res.headersSent) return;
  const status = err?.type === 'entity.too.large' ? 413 : 400;
  res.status(status).json({
    success: false,
    error: status === 413 ? 'Request body too large' : 'Invalid request'
  });
});

export default app;

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const server = app.listen(port, () => console.log(`WINE AI listening on http://localhost:${port}`));
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
}
