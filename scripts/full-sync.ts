import * as dotenv from 'dotenv';
import { database } from '../src/db/database';
import { setSyncService } from '../src/modules/sync/set-sync.service';
import { cardSyncService } from '../src/modules/sync/card-sync.service';
import { productSyncService } from '../src/modules/sync/product-sync.service';

dotenv.config();

async function fullSync() {
  try {
    console.log('='.repeat(80));
    console.log('STARTING FULL SYNC');
    console.log('='.repeat(80));

    await database.connect();

    // FASE 1: Sincronizar sets
    console.log('\n[1/3] Syncing sets from Pokémon TCG API...');
    console.log('-'.repeat(80));
    const setSyncResult = await setSyncService.syncPokemonTCGSets();
    console.log(`Sets synced: ${setSyncResult.synced}`);
    if (setSyncResult.errors.length > 0) {
      console.log(`Errors: ${setSyncResult.errors.slice(0, 5).join(', ')}`);
    }

    // FASE 2: Sincronizar cartas
    console.log('\n[2/3] Syncing cards for all sets...');
    console.log('-'.repeat(80));
    const cardSyncResult = await cardSyncService.syncAllCardsBySets();
    console.log(`Cards synced: ${cardSyncResult.totalSynced}`);
    if (cardSyncResult.totalErrors > 0) {
      console.log(`Errors: ${cardSyncResult.totalErrors}`);
    }

    // FASE 3: Sincronizar productos
    console.log('\n[3/3] Syncing products from TCGCSV...');
    console.log('-'.repeat(80));
    const productSyncResult = await productSyncService.syncAllGroupsProducts();
    console.log(`Products synced: ${productSyncResult.totalSynced}`);
    if (productSyncResult.totalErrors > 0) {
      console.log(`Errors: ${productSyncResult.totalErrors}`);
    }

    // Status final
    console.log('\n' + '='.repeat(80));
    console.log('SYNC SUMMARY');
    console.log('='.repeat(80));
    console.log(`✓ Sets: ${setSyncResult.synced}`);
    console.log(`✓ Cards: ${cardSyncResult.totalSynced}`);
    console.log(`✓ Products: ${productSyncResult.totalSynced}`);
    console.log(`✗ Total Errors: ${setSyncResult.errors.length + cardSyncResult.totalErrors + productSyncResult.totalErrors}`);

    await database.close();
    console.log('\n✓ Full sync completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Full sync failed:', error);
    await database.close();
    process.exit(1);
  }
}

fullSync();
