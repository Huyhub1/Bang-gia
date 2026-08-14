import { v4 as uuidv4 } from 'uuid';

const DINOS_KEY = 'ark_dinos';

// ─── Không có sample data — bắt đầu với danh sách rỗng ─────────────────────

// ─── In-memory fallback (local dev) ──────────────────────────────────────────
// NOTE: Vercel serverless resets memory between invocations.
// For production, configure Upstash Redis via Vercel Integration.
const memStore = { dinos: null };

// ─── Upstash Redis client (production) ───────────────────────────────────────
async function getRedis() {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const { Redis } = await import('@upstash/redis');
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

async function readAll() {
  const redis = await getRedis();
  if (redis) {
    const data = await redis.get(DINOS_KEY);
    // Nếu chưa có key → khởi tạo mảng rỗng, không seed sample
    if (data === null || data === undefined) {
      await redis.set(DINOS_KEY, []);
      return [];
    }
    return Array.isArray(data) ? data : JSON.parse(data);
  }
  // Local dev fallback — khởi đầu rỗng, không seed sample
  if (memStore.dinos === null) {
    memStore.dinos = [];
  }
  return memStore.dinos;
}

async function writeAll(dinos) {
  const redis = await getRedis();
  if (redis) {
    await redis.set(DINOS_KEY, dinos);
  } else {
    memStore.dinos = dinos;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getAllDinos() {
  return readAll();
}

export async function getDino(id) {
  const dinos = await readAll();
  return dinos.find((d) => d.id === id) || null;
}

export async function createDino(data) {
  const dinos = await readAll();
  const newDino = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  dinos.push(newDino);
  await writeAll(dinos);
  return newDino;
}

export async function updateDino(id, data) {
  const dinos = await readAll();
  const idx = dinos.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  dinos[idx] = { ...dinos[idx], ...data, id, updatedAt: new Date().toISOString() };
  await writeAll(dinos);
  return dinos[idx];
}

export async function deleteDino(id) {
  const dinos = await readAll();
  const idx = dinos.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  dinos.splice(idx, 1);
  await writeAll(dinos);
  return true;
}
