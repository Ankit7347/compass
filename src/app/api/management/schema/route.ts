import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const { db, collection, action, fieldName, defaultValue, newFieldName } = await req.json();
    const client = await clientPromise;
    const coll = client.db(db).collection(collection);

    let result;

    switch (action) {
      case 'ADD_FIELD':
        // Adds a new field with a default value to all documents
        result = await coll.updateMany({}, { $set: { [fieldName]: defaultValue } });
        break;

      case 'RENAME_FIELD':
        // Renames a field across all documents
        result = await coll.updateMany({}, { $rename: { [fieldName]: newFieldName } });
        break;

      case 'REMOVE_FIELD':
        // Deletes a field from all documents
        result = await coll.updateMany({}, { $unset: { [fieldName]: "" } });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}