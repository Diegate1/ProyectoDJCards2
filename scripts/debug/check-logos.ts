import * as dotenv from 'dotenv';
import { database } from '../src/db/database';

dotenv.config();

async function checkLogosForSets() {
  await database.connect();

  const result = await database.query(`
    SELECT 
      s.name,
      s.logo_image_url,
      s.symbol_image_url,
      COUNT(DISTINCT c.id) as card_count
    FROM sets s
    LEFT JOIN cards c ON s.id = c.set_id
    WHERE s.language = 'ja'
      AND s.name IN ('M4: Ninja Spinner', 'M3: Nihil Zero', 'MP1: Start Deck 100 Battle Collection')
    GROUP BY s.id, s.name, s.logo_image_url, s.symbol_image_url
  `);

  console.log('\n📦 Japanese Sets - Logo Status:\n');
  result.rows.forEach((row: any) => {
    console.log(`${row.name}`);
    console.log(`  Cards: ${row.card_count}`);
    console.log(`  Logo URL: ${row.logo_image_url ? '✅ ' + row.logo_image_url.substring(0, 80) + '...' : '❌ None'}`);
    console.log();
  });

  process.exit(0);
}

checkLogosForSets();
