// src/app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { EJSON } from 'bson';

/**
 * Converts plain objects (with $oid, $date) into real BSON types (ObjectId, Date).
 * This works for ANY field name.
 */
const prepareForDatabase = (doc: any) => {
  if (!doc) return doc;
  // EJSON.parse converts {"$oid": "..."} into a real ObjectId object
  // and {"$date": "..."} into a real Date object automatically.
  return EJSON.parse(JSON.stringify(doc));
};

/**
 * Converts BSON types (ObjectId, Date) into Extended JSON format.
 * This ensures the frontend sees {"$oid": "..."} instead of just a string.
 */
const serializeDoc = (doc: any) => {
  if (!doc) return doc;
  // EJSON.serialize keeps the rich types visible to your JSON editor
  return EJSON.serialize(doc);
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

    // Parse filter (e.g., {"geolocationStateId": {"$oid": "..."}})
    let query = {};
    try {
      query = EJSON.parse(filterStr); 
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON in Filter' }, { status: 400 });
    }
    
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      collection.find(query).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query)
    ]);

    // Serialize so the frontend editor sees the $oid and $date markers
    const safeDocs = docs.map(serializeDoc);
    return NextResponse.json({ docs: safeDocs, total, page, limit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { db, collection, doc } = await req.json();
    const client = await clientPromise;
    const col = client.db(db).collection(collection);

    // Handle Bulk Insertion (Array)
    if (Array.isArray(doc)) {
      const cleanDocs = doc.map((d) => {
        const cleaned = prepareForDatabase(d);
        // If user didn't provide an _id, MongoDB will create it automatically.
        // If they did provide it (via $oid or string), MongoDB will use it.
        return cleaned;
      });

      const result = await col.insertMany(cleanDocs);
      return NextResponse.json({ 
        success: true, 
        insertedCount: result.insertedCount,
        ids: result.insertedIds 
      });
    } 

    // Handle Single Document Insertion
    const cleanDoc = prepareForDatabase(doc);

    // FIX: Only delete _id if it's explicitly null or empty. 
    // If it exists as an ObjectId or custom string, keep it.
    if (cleanDoc._id === "" || cleanDoc._id === null) {
      delete cleanDoc._id;
    }

    const result = await col.insertOne(cleanDoc);
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId 
    });

  } catch (error: any) {
    // If user provides an _id that already exists, this will catch the "Duplicate Key" error
    return NextResponse.json({ 
      error: error.code === 11000 ? "Duplicate ID: This _id already exists." : error.message 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { db, collection, doc } = await req.json();
    
    // Convert the incoming Extended JSON doc into real BSON
    const cleanDoc = prepareForDatabase(doc);
    
    // Extract the ID (which is now a real ObjectId thanks to prepareForDatabase)
    const targetId = cleanDoc._id;
    if (!targetId) return NextResponse.json({ error: 'Missing _id' }, { status: 400 });

    const { _id, ...updateData } = cleanDoc;

    const client = await clientPromise;
    const result = await client.db(db).collection(collection).updateOne(
      { _id: targetId },
      { $set: updateData }
    );
    
    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const db = searchParams.get('db');
  const collection = searchParams.get('collection');
  const id = searchParams.get('id');

  if (!db || !collection || !id) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  try {
    const client = await clientPromise;
    // Handle if ID is passed as a string or a wrapped object
    const targetId = id.length === 24 ? new ObjectId(id) : EJSON.parse(id);
    
    await client.db(db).collection(collection).deleteOne({ _id: targetId });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}