// Shared hit counter, stored as one small JSON file in Vercel Blob.
// Read-modify-write: a ballpark count, light on the Blob IO budget.
import { put, list } from '@vercel/blob';

const PATH = 'checktos-counter.json';
const EMPTY = { downloads: 0, opens: 0, updated: null };

async function read() {
  try {
    const { blobs } = await list({ prefix: PATH, limit: 1 });
    if (!blobs || !blobs.length) return { ...EMPTY };
    const res = await fetch(blobs[0].url, { cache: 'no-store' });
    if (!res.ok) return { ...EMPTY };
    const data = await res.json();
    return { ...EMPTY, ...data };
  } catch (e) {
    return { ...EMPTY };
  }
}

async function write(counts) {
  await put(PATH, JSON.stringify(counts), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
}

export async function bump(field) {
  const counts = await read();
  counts[field] = (counts[field] || 0) + 1;
  counts.updated = new Date().toISOString();
  await write(counts);
  return counts;
}

export async function getCounts() {
  return read();
}
