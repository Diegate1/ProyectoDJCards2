import * as dotenv from 'dotenv';
import { database } from '../../src/db/database';

dotenv.config();

async function main() {
  console.log('');
  console.log('════════════════════════════════════════════════════════');
  console.log('🔄 MIGRATION SCRIPT - Starting');
  console.log('════════════════════════════════════════════════════════');
  console.log('');
  
  console.log('📋 Environment:');
  console.log(`    DATABASE_URL: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET'}`);
  console.log(`    NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log('');

  try {
    console.log('🔌 Step 1: Connecting to database...');
    console.log('    Executing: database.connect()');
    await database.connect();
    console.log('✓ Database connection established');
    console.log('');

    console.log('🔄 Step 2: Running migrations...');
    console.log('    Executing: database.runMigrations()');
    await database.runMigrations();
    console.log('');

    console.log('════════════════════════════════════════════════════════');
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY');
    console.log('════════════════════════════════════════════════════════');
    console.log('');
    
    await database.close();
    process.exit(0);
  } catch (error) {
    console.log('');
    console.log('════════════════════════════════════════════════════════');
    console.log('❌ MIGRATION FAILED');
    console.log('════════════════════════════════════════════════════════');
    console.error('Error details:');
    console.error(error);
    console.log('');
    
    try {
      await database.close();
    } catch (closeError) {
      console.error('Error closing database:', closeError);
    }
    
    process.exit(1);
  }
}

main();
