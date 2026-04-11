import * as dotenv from 'dotenv';
import { database } from '../src/db/database';
import { setSyncService } from '../src/modules/sync/set-sync.service';
import { cardSyncService } from '../src/modules/sync/card-sync.service';

dotenv.config();

async function syncSet(setId: string) {
  try {
    console.log(`Syncing set: ${setId}`);

    await database.connect();

    // Primero sincronizar todos los sets para tener la referencia
    console.log('Ensuring sets are synced...');
    await setSyncService.syncPokemonTCGSets();

    // Luego sincronizar cartas del set específico
    console.log(`Syncing cards for set ${setId}...`);
    const result = await cardSyncService.syncCardsBySet(setId);

    console.log(`\n✓ Sync completed!`);
    console.log(`  Cards synced: ${result.synced}`);
    console.log(`  Errors: ${result.errors.length}`);

    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('Sync failed:', error);
    await database.close();
    process.exit(1);
  }
}

const setId = process.argv[2];
if (!setId) {
  console.error('Usage: npx ts-node scripts/sync-set.ts <setId>');
  console.error('Example: npx ts-node scripts/sync-set.ts sv1');
  process.exit(1);
}

syncSet(setId);
