// Anonymous open beacon. The generated breakdown page loads /api/ping as an
// image when it opens. Counts one "open"; stores nothing about the document,
// the company, or the user. Returns a 1x1 transparent GIF.
import { bump } from './_counter.js';

const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export default async function handler(req, res) {
  try { await bump('opens'); } catch (e) {}
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.status(200).send(PIXEL);
}
