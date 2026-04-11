import * as dotenv from 'dotenv';
import { database } from '../src/db/database';
import { tcgdexSyncService } from '../src/modules/sync/tcgdex-sync.service';

dotenv.config();

async function syncTCGdex(language: string = 'ja') {
  try {
    console.log(`\n🚀 Starting TCGdex ${language.toUpperCase()} synchronization...`);
    console.log(`Language parameter: ${language}`);

    await database.connect();
    console.log('✓ Database connected\n');

    // Ejecutar sincronización completa
    const result = await tcgdexSyncService.syncAllTCGdexCards(language);

    console.log('\n📊 Synchronization Summary:');
    console.log(`  Total synced: ${result.totalSynced}`);
    console.log(`  Total errors: ${result.totalErrors}`);

    if (result.totalErrors === 0) {
      console.log('\n✅ Sync completed successfully!');
    } else {
      console.log(`\n⚠️  Sync completed with ${result.totalErrors} errors.`);
    }

    await database.close();
    process.exit(result.totalErrors === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    await database.close();
    process.exit(1);
  }
}

const language = process.argv[2] || 'ja';
if (!['ja', 'en', 'fr', 'es', 'de', 'it', 'pt'].includes(language)) {
  console.error(`❌ Invalid language: ${language}`);
  console.error('Supported languages: ja, en, fr, es, de, it, pt');
  process.exit(1);
}

syncTCGdex(language);
