// Counts one "download", then redirects to the actual skill zip.
import { bump } from './_counter.js';

export default async function handler(req, res) {
  try { await bump('downloads'); } catch (e) {}
  res.setHeader('Cache-Control', 'no-store');
  res.writeHead(302, { Location: '/downloads/checktos-skill.zip' });
  res.end();
}
