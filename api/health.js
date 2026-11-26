import { ensureDatabase } from '../db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  try {
    await ensureDatabase();
    return res.status(200).json({
      success: true,
      service: 'WINE AI',
      database: 'connected',
      providers: ['WINE AI Text Engine', 'Star X Images'],
      features: { chat: true, imageGeneration: Boolean(process.env.NOX_API_KEY), imageProvider: process.env.NOX_API_KEY ? 'Star X' : null },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[health database]', error.message);
    return res.status(503).json({
      success: false,
      service: 'WINE AI',
      database: 'disconnected',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
}
