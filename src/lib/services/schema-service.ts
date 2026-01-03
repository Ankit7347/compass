import clientPromise from '../mongodb';

export async function getCollectionSchema(dbName: string, collName: string) {
  const client = await clientPromise;
  const docs = await client.db(dbName).collection(collName).find().limit(100).toArray();
  
  const schema: Record<string, string> = {};
  
  docs.forEach(doc => {
    Object.keys(doc).forEach(key => {
      const value = doc[key];
      schema[key] = Array.isArray(value) ? 'Array' : typeof value;
      if (value instanceof Date) schema[key] = 'Date';
      if (value?._bsontype === 'ObjectId') schema[key] = 'ObjectId';
    });
  });

  return Object.entries(schema).map(([field, type]) => ({ field, type }));
}