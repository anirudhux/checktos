// SSRF-guarded fetch + document collection for peek.
import dnsp from 'node:dns/promises';
import net from 'node:net';

function ipIsPrivate(ip) {
  if (net.isIP(ip) === 4) {
    const p = ip.split('.').map(Number);
    if (p[0] === 10 || p[0] === 127 || p[0] === 0) return true;
    if (p[0] === 169 && p[1] === 254) return true;
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
    if (p[0] === 192 && p[1] === 168) return true;
    if (p[0] >= 224) return true;
    return false;
  }
  const l = ip.toLowerCase();
  if (l === '::1' || l === '::') return true;
  if (l.startsWith('fe80') || l.startsWith('fc') || l.startsWith('fd')) return true;
  if (l.startsWith('::ffff:')) return ipIsPrivate(l.split(':').pop());
  return false;
}
async function assertPublicHost(host) {
  if (net.isIP(host)) { if (ipIsPrivate(host)) throw new Error('blocked-ip'); return; }
  const addrs = await dnsp.lookup(host, { all: true });
  if (!addrs.length) throw new Error('no-dns');
  for (const a of addrs) if (ipIsPrivate(a.address)) throw new Error('blocked-ip');
}
export async function safeFetch(url, { maxBytes = 2_000_000, maxRedirects = 4 } = {}) {
  let cur = url;
  for (let i = 0; i <= maxRedirects; i++) {
    const u = new URL(cur);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('bad-scheme');
    await assertPublicHost(u.hostname);
    const r = await fetch(cur, { redirect: 'manual', headers: { 'user-agent': 'CheckTOS-Peek/1.0' } });
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { cur = new URL(r.headers.get('location'), cur).toString(); continue; }
    const buf = Buffer.from(await r.arrayBuffer());
    return { url: cur, status: r.status, text: buf.toString('utf8').slice(0, maxBytes), contentType: r.headers.get('content-type') || '' };
  }
  throw new Error('too-many-redirects');
}
function stripTags(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
function findOg(html) {
  const m = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i);
  return m ? m[1] : null;
}
function findLinks(html, base) {
  const re = /href=["']([^"']+)["']/gi; const out = []; let m;
  while ((m = re.exec(html))) { try { const u = new URL(m[1], base); if (/privacy|terms|acceptable|dpa|sms|cookie|legal/i.test(u.pathname)) out.push(u.toString()); } catch (e) {} }
  return [...new Set(out)];
}
function looksLikeTerms(u) {
  try { return /(terms|tos|legal|conditions|eula|user-agreement)/i.test(new URL(u).pathname); } catch (e) { return false; }
}
// If the given URL is a homepage (or anything that isn't a terms page), find the
// terms page from it: a linked "Terms" first, then common paths.
async function resolveTerms(inputUrl) {
  const page = await safeFetch(inputUrl);
  if (looksLikeTerms(page.url)) return { terms: page, from: null };
  const links = findLinks(page.text, page.url);
  const pick = links.find(l => /(terms|tos|conditions|user-agreement|eula)/i.test(new URL(l).pathname))
            || links.find(l => /legal/i.test(new URL(l).pathname));
  if (pick) { try { return { terms: await safeFetch(pick), from: page }; } catch (e) {} }
  const origin = new URL(page.url).origin;
  for (const path of ['/terms-of-service', '/terms', '/terms-of-use', '/legal/terms', '/tos', '/legal']) {
    try {
      const t = await safeFetch(origin + path);
      if (t.status >= 200 && t.status < 400 && /(arbitration|liability|agreement|these terms)/i.test(t.text)) return { terms: t, from: page };
    } catch (e) {}
  }
  return { terms: page, from: null, unresolved: true };
}
const DOC_NAMES = { privacy: 'Privacy policy', 'acceptable-use': 'Acceptable use policy', dpa: 'Data processing addendum', sms: 'SMS terms', cookie: 'Cookie policy' };
function stripLocale(pathname) { return pathname.replace(/^\/[a-z]{2}(-[a-z]{2,4})?(?=\/)/i, ''); }
function categorize(pathname) {
  const p = stripLocale(pathname).toLowerCase();
  if (/privacy/.test(p)) return 'privacy';
  if (/acceptable[-_]?use|\baup\b/.test(p)) return 'acceptable-use';
  if (/dpa|data-processing|data-protection/.test(p)) return 'dpa';
  if (/\bsms\b|messaging/.test(p)) return 'sms';
  if (/cookie/.test(p)) return 'cookie';
  return null; // terms / legal / locale copies are not sub-documents
}
export async function collectDocuments(mainUrl) {
  const r = await resolveTerms(mainUrl);
  const main = r.terms;
  const ogImage = findOg((r.from && r.from.text) || main.text) || findOg(main.text);
  const docs = [{ name: 'Terms of service', url: main.url, text: stripTags(main.text).slice(0, 40000) }];
  const seen = new Set();
  for (const l of findLinks(main.text, main.url)) {
    let u; try { u = new URL(l); } catch (e) { continue; }
    if (u.href === main.url) continue;
    const cat = categorize(u.pathname);
    if (!cat || seen.has(cat)) continue;
    seen.add(cat);
    try { const d = await safeFetch(u.href); docs.push({ name: DOC_NAMES[cat], url: u.href, text: stripTags(d.text).slice(0, 30000) }); } catch (e) {}
    if (docs.length >= 5) break;
  }
  return { docs, ogImage, resolvedUrl: main.url, unresolved: !!r.unresolved };
}
