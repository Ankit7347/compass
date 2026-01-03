import { NextRequest, NextResponse } from 'next/server';
import { DbService } from '@/lib/services/db-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dbName = searchParams.get('db');
  if (!dbName) return NextResponse.json({ error: 'Missing db' }, { status: 400 });
  
  const collections = await DbService.getCollections(dbName);
  return NextResponse.json(collections);
}