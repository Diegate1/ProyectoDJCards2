import * as dotenv from 'dotenv';
import { database } from '../../src/db/database';

dotenv.config();

async function main() {
  try {
    console.log('Connecting to database...');
    await database.connect();

    console.log('Running migrations...');
    await database.runMigrations();

    console.log('✓ All migrations completed successfully!');
    await database.close();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
