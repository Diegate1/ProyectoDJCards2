import * as dotenv from 'dotenv';
import { database } from '../src/db/database';
import { tcgtrackingSetSyncService } from '../src/modules/sync/tcgtracking-set-sync.service';

dotenv.config();

async function syncTCGTrackingSets() {
  try {
    console.log('\n🚀 Starting TCGTracking Japanese sets synchronization...');

    await database.connect();
    console.log('✓ Database connected\n');

    // Ejecutar sincronización de sets
    const result = await tcgtrackingSetSyncService.syncTCGTrackingSets();

    console.log('\n📊 Synchronization Summary:');
    console.log(`  Sets synced: ${result.synced}`);
    console.log(`  Total errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errors.slice(0, 10).forEach((err) => {
        console.log(`  - ${err}`);
      });
      if (result.errors.length > 10) {
        console.log(`  ... and ${result.errors.length - 10} more`);
      }
    }

    if (result.errors.length === 0) {
      console.log('\n✅ Sets sync completed successfully!');
    } else {
      console.log(`\n⚠️  Sets sync completed with ${result.errors.length} errors.`);
    }

    await database.close();
    process.exit(result.errors.length === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    await database.close();
    process.exit(1);
  }
}

syncTCGTrackingSets();
