// Run the CheckTOS pipeline over fetched documents via OpenRouter (MiniMax).
// System prompt is the skill's own portable instructions.
import { readFileSync } from 'node:fs';
const SYS = readFileSync(new URL('./_peek-prompt.md', import.meta.url), 'utf8');

// Reasoning models (MiniMax M-series) may wrap the JSON in <think> blocks or
// ```json fences, or add prose. Strip those, then balance-match the object.
function extractJson(txt) {
  if (!txt) throw new Error('llm-empty');
  let s = String(txt).replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  try { return JSON.parse(s); } catch (e) {}
  const start = s.indexOf('{');
  if (start >= 0) {
    let depth = 0, inStr = false, esc = false;
    for (let k = start; k < s.length; k++) {
      const c = s[k];
      if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; }
      else if (c === '"') inStr = true;
      else if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { try { return JSON.parse(s.slice(start, k + 1)); } catch (e2) { break; } } }
    }
  }
  throw new Error('llm-parse');
}

function apiKey() { return process.env.OPENROUTER_API_KEY || process.env.checktos_peek; }

async function callOnce(user) {
  const key = apiKey();
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://checktos.com', 'X-Title': 'CheckTOS Peek' },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash-lite',
      temperature: 0,
      max_tokens: Number(process.env.OPENROUTER_MAX_TOKENS) || 16000,
      messages: [{ role: 'system', content: SYS }, { role: 'user', content: user }]
    })
  });
  const j = await r.json();
  if (j && j.error) throw new Error('llm: ' + (j.error.message || JSON.stringify(j.error)));
  if (!r.ok) throw new Error('llm-' + r.status);
  const content = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  return extractJson(content);
}

export async function analyze(docs, sourceUrl) {
  if (!apiKey()) throw new Error('engine-not-configured');
  const docText = docs.map(d => '### ' + d.name + ' (' + d.url + ')\n' + d.text).join('\n\n').slice(0, 120000);
  const user = 'Source: ' + sourceUrl + '\n\nProduce a CheckTOS breakdown as ONE JSON object with EXACTLY these fields: product, byline, entity, source_url, og_image, intro, clarity{band,note,marker_pct}, meta:[{label,value,href}], headline, takeaways:[{text,tag}], decide{region,org,risk}, journeys:[{name,summary,quotes:[{quote,src}],note}] (exactly four, named Product, Usage, Feedback & improvement, Legal ramifications), flags:[{name,count,items}], contacts:[{purpose,detail,src}], caveat. clarity.band MUST be exactly one of "Plain English", "Some legalese", "Dense", "Needs a lawyer" (a readability scale from clear to dense), and clarity.marker_pct is 0-100 on that scale; never use Easy, Moderate, or Hard. Every quote MUST be verbatim from the documents. Wrap the highest-signal phrases in <strong></strong> inside summaries and takeaways. Assign no risk level. Every list field (takeaways, meta, contacts, journeys, each journey\'s quotes, and flags) MUST be a JSON array in square brackets, never an object; flags is an array of {name, count, items} with one entry per category (One-sided, Absolute, Undefined terms, Scope limits, Gaps, Contradictions). decide.region, decide.org, and decide.risk are each a single plain-text string (not a nested object). Output ONLY the JSON object, no prose, no markdown fences.\n\nDOCUMENTS:\n' + docText;
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try { return await callOnce(user); }
    catch (e) { lastErr = e; }
  }
  throw lastErr;
}
