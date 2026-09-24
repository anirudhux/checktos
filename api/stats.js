// Private read of the stored counts. Gated by a secret in the query string:
//   /api/stats?key=YOUR_STATS_KEY
// Returns { downloads, opens, updated }. Numbers only.
import { getCounts } from './_counter.js';

export default async function handler(req, res) {
  const key = req.query && req.query.key;
  if (!process.env.STATS_KEY || key !== process.env.STATS_KEY) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    const counts = await getCounts();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(counts);
  } catch (e) {
    res.status(500).json({ error: 'stats unavailable' });
  }
}
