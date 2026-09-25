# Tracking

Two numbers, stored as one JSON file in Vercel Blob: `downloads` and `opens`.

- **downloads** — the "Download skill" buttons point at `/api/download`, which counts one, then redirects to `/downloads/checktos-skill.zip`.
- **opens** — each generated breakdown page loads `/api/ping` as an image when it opens. Anonymous: nothing about the document, the company, or the user is sent. Silent offline.

## Reading the count
`https://checktos.com/api/stats?key=YOUR_STATS_KEY` returns `{ downloads, opens, updated }`.
Vercel's project dashboard also shows how often `/api/ping` and `/api/download` run, as a free trend graph.

## One-time setup (needs your Vercel login)
1. In the Vercel project, create a Blob store and connect it. Vercel injects `BLOB_READ_WRITE_TOKEN` automatically; the endpoints use it.
2. Add an environment variable `STATS_KEY` set to a secret of your choice. That is the `key` in the stats URL.
3. Redeploy.

## Notes
- The counter is read-modify-write on one file: a ballpark, light on Blob IO. Simultaneous hits can drop one. If opens ever get heavy, switch `/api/ping` to writing one small file per hit and counting by listing.
- `@vercel/blob` is pinned to `latest` in `package.json`; pin an exact version once it is in.

## Peek stats
`https://checktos.com/api/peek-stats?key=YOUR_STATS_KEY` — total peek runs, top products checked (by host), country breakdown, per-day counts, and consent split. Reads the `peek-logs/` entries; needs the Blob store connected and `STATS_KEY` set.
