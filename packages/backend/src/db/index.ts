import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import env from '../env';

const client = postgres(env.dbUrl as string);
export const db = drizzle(client, { schema });
export * from './schema'; 