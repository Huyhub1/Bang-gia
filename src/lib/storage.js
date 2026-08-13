import { v4 as uuidv4 } from 'uuid';

const DINOS_KEY = 'ark_dinos';

// ─── Sample seed data ────────────────────────────────────────────────────────
const SAMPLE_DINOS = [
  {
    id: 'sample-1',
    name: 'T-Rex (Rex)',
    category: 'carnivore',
    level: 150,
    price: 500,
    currency: 'Element',
    imageUrl: 'https://static.wikia.nocookie.net/arksurvivalevolved/images/d/d7/Rex.webp/revision/latest/scale-to-width-down/200',
    description: 'Vua của các loài khủng long. Sức mạnh hủy diệt không đối thủ trên chiến trường.',
    available: true,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    name: 'Wyvern (Lửa)',
    category: 'flyer',
    level: 190,
    price: 1200,
    currency: 'Element',
    imageUrl: 'https://static.wikia.nocookie.net/arksurvivalevolved/images/c/cb/Fire_Wyvern.webp/revision/latest/scale-to-width-down/200',
    description: 'Rồng lửa mạnh nhất, phun lửa thiêu đốt kẻ thù trong bán kính rộng.',
    available: true,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-3',
    name: 'Giganotosaurus (Giga)',
    category: 'carnivore',
    level: 120,
    price: 800,
    currency: 'Element',
    imageUrl: 'https://static.wikia.nocookie.net/arksurvivalevolved/images/8/84/Giganotosaurus.webp/revision/latest/scale-to-width-down/200',
    description: 'Quái vật khổng lồ với rage mode cực kỳ nguy hiểm.',
    available: false,
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-4',
    name: 'Argentavis',
    category: 'flyer',
    level: 200,
    price: 300,
    currency: 'Element',
    imageUrl: 'https://static.wikia.nocookie.net/arksurvivalevolved/images/a/a7/Argentavis.webp/revision/latest/scale-to-width-down/200',
    description: 'Đại bàng khổng lồ, tốt nhất để vận chuyển và leo núi.',
    available: true,
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sample-5',
    name: 'Mosasaurus',
    category: 'aquatic',
    level: 135,
    price: 600,
    currency: 'Element',
    imageUrl: 'https://static.wikia.nocookie.net/arksurvivalevolved/images/b/b3/Mosasaurus.webp/revision/latest/scale-to-width-down/200',
    description: 'Bá chủ vùng biển sâu, không con nào sánh bằng dưới nước.',
    available: true,
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

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
    if (!data) {
      await redis.set(DINOS_KEY, SAMPLE_DINOS);
      return [...SAMPLE_DINOS];
    }
    return Array.isArray(data) ? data : JSON.parse(data);
  }
  // Local dev fallback
  if (!memStore.dinos) {
    memStore.dinos = [...SAMPLE_DINOS];
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
