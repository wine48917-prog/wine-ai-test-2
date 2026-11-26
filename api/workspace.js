import { maintenanceGuard } from '../src/lib/site-control.js';
import { APP_HTML } from './owner.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
  if (await maintenanceGuard(req, res)) return;
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(APP_HTML);
}
