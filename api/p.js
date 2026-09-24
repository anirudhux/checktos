// Serve a stored peek breakdown by id (share link + download).
import { list } from '@vercel/blob';
export default async function handler(req, res) {
  const id = req.query && req.query.id;
  const dl = req.query && req.query.dl;
  if (!id || !/^[a-f0-9]{6,32}$/i.test(id)) { res.status(400).send('bad id'); return; }
  try {
    const { blobs } = await list({ prefix: 'p/' + id + '.html', limit: 1 });
    if (!blobs.length) { res.status(404).send('This breakdown was not found or has expired.'); return; }
    const r = await fetch(blobs[0].url, { cache: 'no-store' });
    const html = await r.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (dl) res.setHeader('Content-Disposition', 'attachment; filename="' + id + '-checktos.html"');
    res.status(200).send(html);
  } catch (e) { res.status(500).send('unavailable'); }
}
