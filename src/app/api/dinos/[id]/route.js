import { NextResponse } from 'next/server';
import { getDino, updateDino, deleteDino } from '@/lib/storage';
import { validateToken, extractToken } from '@/lib/auth';

function authCheck(request) {
  const token = extractToken(request.headers.get('Authorization'));
  return validateToken(token);
}

// GET /api/dinos/:id — public
export async function GET(_, { params }) {
  const dino = await getDino(params.id);
  if (!dino) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(dino);
}

// PUT /api/dinos/:id — admin only
export async function PUT(request, { params }) {
  if (!authCheck(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const updated = await updateDino(params.id, {
    name:        body.name,
    category:    body.category,
    level:       body.level ? Number(body.level) : null,
    price:       Number(body.price),
    currency:    body.currency,
    imageUrl:    body.imageUrl,
    description: body.description,
    available:   body.available,
    featured:    body.featured,
  });

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

// DELETE /api/dinos/:id — admin only
export async function DELETE(request, { params }) {
  if (!authCheck(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ok = await deleteDino(params.id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
