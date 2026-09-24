// Render a manifest into HTML by filling the locked breakdown template.
// embed=true strips the header/footer (for inline display on /peek) and adds a
// height reporter; embed=false returns the full standalone page (share/download).
import { readFileSync } from 'node:fs';

const TPL = readFileSync(new URL('./_breakdown-template.html', import.meta.url), 'utf8');

// Flatten anything (string, array, nested object) to readable text — never "[object Object]".
function toText(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(toText).filter(Boolean).join('; ');
  if (typeof v === 'object') return Object.values(v).map(toText).filter(Boolean).join('; ');
  return String(v);
}
function esc(s) { return toText(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function arr(x) { return Array.isArray(x) ? x : []; }
// Escape once, then restore a small safe allowlist of inline markup the design
// uses: <strong>, <br>, <span class="q">, and <a> to mailto:/http(s): only.
// Everything else (incl. any injected <script>/on*=) stays escaped.
function rich(s) {
  s = esc(s);
  s = s.replace(/&lt;strong&gt;/g, '<strong>').replace(/&lt;\/strong&gt;/g, '</strong>');
  s = s.replace(/&lt;br\s*\/?&gt;/g, '<br>');
  s = s.replace(/&lt;span class="q"&gt;/g, '<span class="q">').replace(/&lt;\/span&gt;/g, '</span>');
  s = s.replace(/&lt;a href="(mailto:[^"]*|https?:\/\/[^"]*)"&gt;/g, '<a href="$1">').replace(/&lt;\/a&gt;/g, '</a>');
  return s;
}

function mediaHtml(m) {
  if (!m.og_image) return '';
  return '<div class="phead-media-wide"><img src="' + esc(m.og_image) + '" alt="' + esc(m.product) + '" /></div>';
}
// The meter speaks one vocabulary: Plain English -> Some legalese -> Dense -> Needs a lawyer.
const BAND_MAP = { easy: 'Plain English', moderate: 'Some legalese', hard: 'Dense', 'very hard': 'Needs a lawyer' };
const BAND_PCT = { 'plain english': 12, 'some legalese': 37, 'dense': 63, 'needs a lawyer': 88 };
function bandLabel(b) { if (!b) return 'Some legalese'; const k = String(b).trim().toLowerCase(); return BAND_MAP[k] || b; }
function clarityTrack(c) {
  const nodes = '<span class="cm-node" style="left: 33%"><span class="cm-tip">Some legalese</span></span><span class="cm-node" style="left: 67%"><span class="cm-tip">Dense</span></span>';
  let mk = Number(c && c.marker_pct);
  if (!(mk >= 0 && mk <= 100)) mk = BAND_PCT[bandLabel(c && c.band).toLowerCase()] || 50;
  return nodes + '<span class="cm-marker" style="left: ' + mk + '%"></span>';
}
function metaHtml(rows) {
  return arr(rows).map(r => '<div>' + esc(r.label) + ': <span>' + (r.href ? '<a href="' + esc(r.href) + '">' + esc(r.value) + '</a>' : esc(r.value)) + '</span></div>').join('');
}
function takeawaysHtml(list) {
  return arr(list).map(t => '<li><span class="tk-text">' + rich(t.text) + '</span><span class="tk-tag">' + esc(t.tag) + '</span></li>').join('');
}
function decideHtml(d) {
  return ['region','org','risk'].map(k => {
    const t = toText(d[k]).trim();
    if (!t) return ''; // hide a row we can't resolve to text
    return '<div class="decide-row"><div class="d-axis">' + k + '</div><div class="d-facts">' + rich(d[k]) + '</div></div>';
  }).join('');
}
function journeysHtml(list) {
  return arr(list).map(j => {
    const quotes = arr(j.quotes).map(q => '<blockquote>"' + esc(q.quote) + '"<span class="src">' + esc(q.src) + '</span></blockquote>').join('');
    return '<div class="journey"><h3 class="jname">' + esc(j.name) + '</h3><p class="summary">' + rich(j.summary) + '</p><div class="qcard">' + quotes + '</div><p class="note">' + rich(j.note || '') + '</p></div>';
  }).join('');
}
function flagsHtml(list) {
  return arr(list).map(f => '<div class="flagrow"><div><span class="flagname">' + esc(f.name) + '</span><br><span class="flagcount">' + Number(f.count) + ' found</span></div><div class="flagitems">' + rich(f.items || '') + '</div></div>').join('');
}
function contactsHtml(list) {
  return arr(list).map(c => '<div class="contact-row"><div class="c-purpose">' + esc(c.purpose) + '</div><div class="c-detail">' + rich(c.detail) + '<span class="c-src">' + esc(c.src) + '</span></div></div>').join('');
}

export function render(m, opts = {}) {
  const map = {
    PRODUCT: esc(m.product),
    BYLINE: esc(m.byline),
    SOURCE_URL: esc(m.source_url || '#'),
    ENTITY: esc(m.entity || m.product),
    MEDIA_HTML: mediaHtml(m),
    INTRO: rich(m.intro),
    CLARITY_BAND: esc(bandLabel(m.clarity && m.clarity.band)),
    CLARITY_TRACK_HTML: clarityTrack(m.clarity || {}),
    CLARITY_NOTE: rich(m.clarity && m.clarity.note),
    META_HTML: metaHtml(m.meta),
    HEADLINE: rich(m.headline),
    TAKEAWAYS_HTML: takeawaysHtml(m.takeaways),
    DECIDE_HTML: decideHtml(m.decide || {}),
    JOURNEYS_HTML: journeysHtml(m.journeys),
    FLAGS_HTML: flagsHtml(m.flags),
    CONTACTS_HTML: contactsHtml(m.contacts),
    CAVEAT_HTML: rich(m.caveat)
  };
  let html = TPL.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in map ? map[k] : ''));
  if (opts.embed) {
    html = html.replace(/<header class="bar">[\s\S]*?<\/header>/, '')
               .replace(/<footer>[\s\S]*?<\/footer>/, '')
               .replace(/<script>[\s\S]*?<\/script>\s*<\/body>/, '<script>function _h(){parent.postMessage({checktosHeight:document.documentElement.scrollHeight},"*");}window.addEventListener("load",_h);setTimeout(_h,300);new ResizeObserver(_h).observe(document.body);</script></body>');
  }
  return html;
}
