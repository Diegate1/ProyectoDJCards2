import * as dotenv from 'dotenv';
import { database } from '../src/db/database';
import { tcgdexChineseSyncService } from '../src/modules/tcgdex/tcgdex-chinese-sync.service';

dotenv.config();

async function syncChineseData() {
  try {
    console.log('🚀 Starting TCGdex Chinese (zh-cn) synchronization...');
    console.log('API: https://api.tcgdex.net/v2/zh-cn');
    console.log('Language: 中文 (Simplified Chinese)\n');

    await database.connect();

    const result = await tcgdexChineseSyncService.syncChineseSets();

    console.log('\n📊 Synchronization Summary:');
    console.log(`  Cards synced: ${result.synced}`);
    console.log(`  Total errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      result.errors.slice(0, 5).forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
      if (result.errors.length > 5) {
        console.log(`  ... and ${result.errors.length - 5} more errors`);
      }
    }

    console.log('\n✅ Chinese data sync completed!');
    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('Sync failed:', error);
    await database.close();
    process.exit(1);
  }
}

syncChineseData();
