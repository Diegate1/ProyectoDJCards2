import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  skipDatabase: z.coerce.boolean().default(false),
  database: z.object({
    host: z.string().default('localhost'),
    port: z.coerce.number().default(5432),
    user: z.string().default('pokemon'),
    password: z.string().default('pokemon'),
    database: z.string().default('pokemontcg'),
  }),
  frontendUrl: z.string().default('http://localhost:5173'),
  apiBaseUrl: z.string().default('http://localhost:3000'),
});

export type Config = z.infer<typeof configSchema>;

function parseDatabaseUrl(url: string): { host: string; port: number; user: string; password: string; database: string } {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }
  return {
    host: match[3],
    port: parseInt(match[4], 10),
    user: match[1],
    password: match[2],
    database: match[5],
  };
}

function loadConfig(): Config {
  const databaseUrl = process.env.DATABASE_URL;
  
  let databaseConfig;
  if (databaseUrl) {
    databaseConfig = parseDatabaseUrl(databaseUrl);
  } else {
    databaseConfig = {
      host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || process.env.POSTGRES_PORT || '5432', 10),
      user: process.env.POSTGRES_USER || 'pokemon',
      password: process.env.POSTGRES_PASSWORD || 'pokemon',
      database: process.env.POSTGRES_DB || 'pokemontcg',
    };
  }

  const rawConfig = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    skipDatabase: process.env.SKIP_DATABASE === 'true',
    database: databaseConfig,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  };

  return configSchema.parse(rawConfig);
}

export const config = loadConfig();

export function getDatabaseUrl(): string {
  const { database } = config;
  return `postgresql://${database.user}:${database.password}@${database.host}:${database.port}/${database.database}`;
}
