import { NextResponse } from 'next/server';
import { getAllDinos, createDino } from '@/lib/storage';
import { validateToken, extractToken } from '@/lib/auth';

// GET /api/dinos — public, no auth required
export async function GET() {
  const dinos = await getAllDinos();
  return NextResponse.json(dinos);
}

// POST /api/dinos — requires admin token
export async function POST(request) {
  const token = extractToken(request.headers.get('Authorization'));
  if (!validateToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Validate required fields
  if (!body.name || body.price === undefined || body.price === '') {
    return NextResponse.json({ error: 'Thiếu tên hoặc giá!' }, { status: 400 });
  }

  const newDino = await createDino({
    name:        body.name        || '',
    category:    body.category    || 'utility',
    level:       body.level       ? Number(body.level) : null,
    price:       Number(body.price),
    currency:    body.currency    || 'Element',
    imageUrl:    body.imageUrl    || '',
    description: body.description || '',
    available:   body.available   !== false,
    featured:    body.featured    === true,
  });

  return NextResponse.json(newDino, { status: 201 });
}
