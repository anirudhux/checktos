// Peek engine: verify Turnstile, log, analyze (skill pipeline via OpenRouter),
// render, store for share/download, return the inline embed.
import { put, list } from '@vercel/blob';
import { readFileSync } from 'node:fs';
import crypto from 'node:crypto';
import { render } from './_peek-render.js';
import { collectDocuments } from './_peek-fetch.js';
import { analyze } from './_peek-analyze.js';

const FIXTURE = JSON.parse(readFileSync(new URL('./_peek-fixture.json', import.meta.url), 'utf8'));
const TEST_SECRET = '1x0000000000000000000000000000000AA';
const CACHE_DAYS = 30;

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET || TEST_SECRET;
  try {
    const body = new URLSearchParams({ secret, response: token || '' });
    if (ip) body.append('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const d = await r.json();
    return !!d.success;
  } catch (e) { return false; }
}
function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  return (xff ? String(xff).split(',')[0].trim() : '') || req.headers['x-real-ip'] || '';
}
async function logRequest(url, req, consent) {
  const entry = { url, ts: new Date().toISOString(), country: req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || null, region: req.headers['x-vercel-ip-country-region'] || null, city: req.headers['x-vercel-ip-city'] || null, ua: req.headers['user-agent'] || null, referer: req.headers['referer'] || null, lang: req.headers['accept-language'] || null, consent: consent || 'unset' };
  try { await put('peek-logs/' + entry.ts.replace(/[:.]/g, '-') + '.json', JSON.stringify(entry), { access: 'public', addRandomSuffix: true, contentType: 'application/json' }); } catch (e) {}
}
async function getCache(id) {
  try {
    const { blobs } = await list({ prefix: 'peek-cache/' + id + '.json', limit: 1 });
    if (!blobs.length) return null;
    const r = await fetch(blobs[0].url, { cache: 'no-store' });
    const c = await r.json();
    if (Date.now() - new Date(c.ts).getTime() > CACHE_DAYS * 864e5) return null;
    return c.manifest;
  } catch (e) { return null; }
}
async function store(id, manifest, standalone) {
  try { await put('p/' + id + '.html', standalone, { access: 'public', addRandomSuffix: false, contentType: 'text/html' }); } catch (e) {}
  try { await put('peek-cache/' + id + '.json', JSON.stringify({ ts: new Date().toISOString(), manifest }), { access: 'public', addRandomSuffix: false, contentType: 'application/json' }); } catch (e) {}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method not allowed' }); return; }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  let url = body && body.url;
  if (typeof url === 'string') url = url.trim();
  if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/+/, '');
  if (!url || !/^https?:\/\//i.test(url)) { res.status(400).json({ error: 'bad url' }); return; }

  const ip = clientIp(req);
  if (!(await verifyTurnstile(body.token, ip))) { res.status(403).json({ error: 'bot check failed' }); return; }
  await logRequest(url, req, body.consent);

  const id = crypto.createHash('sha1').update(url).digest('hex').slice(0, 12);
  let manifest = await getCache(id);
  let demo = false;

  if (!manifest) {
    try {
      const { docs, ogImage } = await collectDocuments(url);
      manifest = await analyze(docs, url);
      if (ogImage && !manifest.og_image) manifest.og_image = ogImage;
    } catch (e) {
      if (String(e.message).includes('engine-not-configured')) { manifest = FIXTURE; demo = true; }
      else { res.status(502).json({ error: 'Could not read that page right now. Try another link.' }); return; }
    }
    if (!demo) await store(id, manifest, render(manifest, { embed: false }));
    else await store(id, manifest, render(manifest, { embed: false }));
  }

  const embedHtml = render(manifest, { embed: true });
  res.status(200).json({ ok: true, demo, embedHtml, shareUrl: '/api/p?id=' + id, downloadUrl: '/api/p?id=' + id + '&dl=1', message: demo ? 'Demo output shown (analysis engine not connected yet).' : null });
}
