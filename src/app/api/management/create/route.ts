import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const { db, collection } = await req.json();
    const client = await clientPromise;
    
    // Create the collection by inserting one placeholder document
    await client.db(db).collection(collection).insertOne({
      _id_info: "Initial document created by LapisDB",
      created_at: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create namespace' }, { status: 500 });
  }
}