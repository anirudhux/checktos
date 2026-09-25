// Private peek analytics: aggregates the peek-logs/ entries in Blob.
//   /api/peek-stats?key=YOUR_STATS_KEY
// Needs Blob connected + STATS_KEY set. Numbers and hostnames only.
import { list } from '@vercel/blob';

function host(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return '(invalid)'; } }
function top(o, n) { return Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count })); }

export default async function handler(req, res) {
  const key = req.query && req.query.key;
  if (!process.env.STATS_KEY || key !== process.env.STATS_KEY) { res.status(401).json({ error: 'unauthorized' }); return; }
  try {
    // Gather log metadata (paginated, capped).
    let cursor, blobs = [], pages = 0;
    do {
      const r = await list({ prefix: 'peek-logs/', cursor, limit: 1000 });
      blobs = blobs.concat(r.blobs || []);
      cursor = r.cursor;
      pages++;
    } while (cursor && pages < 10 && blobs.length < 10000);

    const total = blobs.length;
    // pathname starts with the ISO timestamp, so lexical desc = newest first
    blobs.sort((a, b) => (a.pathname < b.pathname ? 1 : -1));
    const sample = blobs.slice(0, 1000);

    const entries = [];
    for (let i = 0; i < sample.length; i += 25) {
      const got = await Promise.all(sample.slice(i, i + 25).map(b => fetch(b.url, { cache: 'no-store' }).then(r => r.json()).catch(() => null)));
      for (const e of got) if (e) entries.push(e);
    }

    const byCountry = {}, byHost = {}, byDay = {}, consent = {};
    for (const e of entries) {
      byCountry[e.country || '??'] = (byCountry[e.country || '??'] || 0) + 1;
      byHost[host(e.url)] = (byHost[host(e.url)] || 0) + 1;
      const day = (e.ts || '').slice(0, 10); if (day) byDay[day] = (byDay[day] || 0) + 1;
      consent[e.consent || 'unset'] = (consent[e.consent || 'unset'] || 0) + 1;
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      total_runs: total,
      sampled: entries.length,
      first_seen: entries.length ? entries[entries.length - 1].ts : null,
      last_seen: entries.length ? entries[0].ts : null,
      top_products: top(byHost, 25),
      by_country: top(byCountry, 25),
      by_day: Object.entries(byDay).sort().map(([day, count]) => ({ day, count })),
      consent
    });
  } catch (e) {
    res.status(500).json({ error: 'stats unavailable — is the Blob store connected?' });
  }
}
