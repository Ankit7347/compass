import { NextResponse } from 'next/server';
import { DbService } from '@/lib/services/db-service';

export async function GET() {
  try {
    const dbs = await DbService.listDatabases();
    return NextResponse.json(dbs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch databases' }, { status: 500 });
  }
}