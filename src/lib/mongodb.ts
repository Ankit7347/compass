import { MongoClient } from 'mongodb';
import { env } from '@/config/env';

const uri = env.MONGODB_URI;
let client: MongoClient = new MongoClient(uri);
let clientPromise: Promise<MongoClient> = client.connect();

export default clientPromise;