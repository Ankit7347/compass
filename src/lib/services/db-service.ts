import clientPromise from '../mongodb';

export class DbService {
  static async listDatabases() {
    const client = await clientPromise;
    const result = await client.db().admin().listDatabases();
    return result.databases;
  }

  static async getCollections(dbName: string) {
    const client = await clientPromise;
    const collections = await client.db(dbName).listCollections().toArray();
    return collections;
  }
}