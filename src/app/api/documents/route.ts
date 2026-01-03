import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Helper to convert MongoDB BSON types to plain JSON
const serializeDoc = (doc: any) => {
  if (!doc) return doc;
  const serialized = { ...doc };
  if (doc._id) serialized._id = doc._id.toString();
  
  // Recursively handle Dates or nested ObjectIds if necessary
  Object.keys(serialized).forEach(key => {
    if (serialized[key] instanceof Date) {
      serialized[key] = serialized[key].toISOString();
    }
  });
  return serialized;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dbName = searchParams.get('db');
  const collectionName = searchParams.get('collection');
  const filterStr = searchParams.get('filter') || "{}";
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!dbName || !collectionName) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // 1. Parse Filter
    let query = {};
    try {
      query = JSON.parse(filterStr);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON in Filter' }, { status: 400 });
    }
    
    const skip = (page - 1) * limit;

    // 2. Fetch Data
    const [docs, total] = await Promise.all([
      collection.find(query).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query)
    ]);

    // 3. Serialize for Frontend (Crucial Step)
    const safeDocs = docs.map(serializeDoc);

    return NextResponse.json({ docs: safeDocs, total, page, limit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'DB Error' }, { status: 500 });
  }
}

// POST - Create a new document
export async function POST(req: NextRequest) {
  try {
    const { db, collection, doc } = await req.json();
    const client = await clientPromise;
    
    // Remove _id if it's empty string or null so MongoDB generates a fresh one
    if (doc._id) delete doc._id;

    const result = await client.db(db).collection(collection).insertOne(doc);
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a document
export async function PUT(req: NextRequest) {
  try {
    const { db, collection, doc } = await req.json();
    const { _id, ...updateData } = doc;

    if (!_id) return NextResponse.json({ error: 'Missing _id' }, { status: 400 });

    const client = await clientPromise;
    await client.db(db).collection(collection).updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateData }
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove a document
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const db = searchParams.get('db');
  const collection = searchParams.get('collection');
  const id = searchParams.get('id');

  if (!db || !collection || !id) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  try {
    const client = await clientPromise;
    await client.db(db).collection(collection).deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}