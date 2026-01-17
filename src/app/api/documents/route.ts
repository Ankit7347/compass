// src/app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { EJSON } from 'bson';
/**
 * Helper to recursively find strings that look like IDs or Dates 
 * and convert them back to BSON types.
 */
const prepareForDatabase = (obj: any) => {
  if (obj === null || typeof obj !== 'object') return obj;

  for (const key in obj) {
    const value = obj[key];

    // 1. Convert _id or fields ending in 'Id' to ObjectId
    // Only converts if it's a valid 24-character hex string
    if ((key === '_id' || key.toLowerCase().endsWith('id')) && typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
      obj[key] = new ObjectId(value);
    } 
    // 2. Convert ISO Date strings back to Date objects
    else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        obj[key] = date;
      }
    } 
    // 3. Recurse into nested objects or arrays
    else if (typeof value === 'object') {
      prepareForDatabase(value);
    }
  }
  return obj;
};
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

    // Parse using EJSON to handle {$oid: ...} and {$date: ...}
    let query = {};
    try {
      query = EJSON.parse(filterStr); 
    } catch (e) {
      return NextResponse.json({ error: 'Invalid Extended JSON in Filter' }, { status: 400 });
    }
    
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      collection.find(query).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query)
    ]);

    const safeDocs = docs.map(serializeDoc);
    return NextResponse.json({ docs: safeDocs, total, page, limit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



// POST - Create a new document
export async function POST(req: NextRequest) {
  try {
    const { db, collection, doc } = await req.json();
    const client = await clientPromise;
    
    // Prepare the document: handles nested IDs and Dates
    const cleanDoc = prepareForDatabase(doc);

    // Remove _id if it's a placeholder so Mongo generates a real one
    if (cleanDoc._id) delete cleanDoc._id;

    const result = await client.db(db).collection(collection).insertOne(cleanDoc);
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a document
export async function PUT(req: NextRequest) {
  try {
    const { db, collection, doc } = await req.json();
    
    // 1. Extract the ID string before cleaning
    const idString = doc._id;
    if (!idString) return NextResponse.json({ error: 'Missing _id' }, { status: 400 });

    // 2. Clean the rest of the document (converts nested IDs/Dates)
    const cleanDoc = prepareForDatabase(doc);
    const { _id, ...updateData } = cleanDoc;

    const client = await clientPromise;
    const result = await client.db(db).collection(collection).updateOne(
      { _id: new ObjectId(idString) },
      { $set: updateData }
    );
    
    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
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