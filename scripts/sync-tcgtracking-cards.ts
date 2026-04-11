import * as dotenv from 'dotenv';
import { database } from '../src/db/database';
import { tcgtrackingCardSyncService } from '../src/modules/sync/tcgtracking-card-sync.service';

dotenv.config();

async function syncTCGTrackingCards() {
  try {
    console.log('\n🚀 Starting TCGTracking Japanese cards synchronization...');

    await database.connect();
    console.log('✓ Database connected\n');

    // Ejecutar sincronización de cartas
    const result = await tcgtrackingCardSyncService.syncAllCardsBySets();

    console.log('\n📊 Synchronization Summary:');
    console.log(`  Cards synced: ${result.totalSynced}`);
    console.log(`  Total errors: ${result.totalErrors}`);

    if (result.totalErrors === 0) {
      console.log('\n✅ Cards sync completed successfully!');
    } else {
      console.log(`\n⚠️  Cards sync completed with ${result.totalErrors} errors.`);
    }

    await database.close();
    process.exit(result.totalErrors === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    await database.close();
    process.exit(1);
  }
}

syncTCGTrackingCards();
