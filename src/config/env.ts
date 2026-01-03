import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().url(),
  DB_NAME: z.string().default('admin'),
});

export const env = envSchema.parse({
  MONGODB_URI: process.env.MONGODB_URI,
  DB_NAME: process.env.DB_NAME,
});