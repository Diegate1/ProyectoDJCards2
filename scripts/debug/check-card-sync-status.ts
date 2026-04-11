/**
 * Script: Revisar status de sincronización de cartas
 */

import * as dotenv from 'dotenv';
import { database } from '../src/db/database';

dotenv.config();

async function checkCardSync() {
  await database.connect();

  console.log('\n📊 ESTADO DE SINCRONIZACIÓN DE CARTAS\n');
  console.log('═'.repeat(80));

  // 1. Total de sets
  const setsResult = await database.query(`
    SELECT COUNT(*) as count FROM sets WHERE language = 'ja'
  `);
  const totalSets = parseInt(setsResult.rows[0].count);

  // 2. Sets con cartas
  const setsWithCards = await database.query(`
    SELECT COUNT(DISTINCT set_id) as count FROM cards
    WHERE set_id IN (SELECT id FROM sets WHERE language = 'ja')
  `);
  const setsWithCardsCount = parseInt(setsWithCards.rows[0].count);

  // 3. Total de cartas
  const cardsResult = await database.query(`
    SELECT COUNT(*) as count FROM cards
    WHERE set_id IN (SELECT id FROM sets WHERE language = 'ja')
  `);
  const totalCards = parseInt(cardsResult.rows[0].count);

  // 4. Cartas sin imagen
  const cardsNoImage = await database.query(`
    SELECT COUNT(*) as count FROM cards
    WHERE set_id IN (SELECT id FROM sets WHERE language = 'ja')
      AND (image_small_url IS NULL OR image_small_url = '')
  `);
  const noImageCount = parseInt(cardsNoImage.rows[0].count);

  console.log(`\n📦 Sets:`);
  console.log(`   Total: ${totalSets}`);
  console.log(`   Con cartas: ${setsWithCardsCount} (${((setsWithCardsCount/totalSets)*100).toFixed(1)}%)`);
  console.log(`   Sin cartas: ${totalSets - setsWithCardsCount}`);

  console.log(`\n🃏 Cartas:`);
  console.log(`   Total: ${totalCards}`);
  console.log(`   Con imagen: ${totalCards - noImageCount} (${(((totalCards-noImageCount)/totalCards)*100).toFixed(1)}%)`);
  console.log(`   Sin imagen: ${noImageCount} (${((noImageCount/totalCards)*100).toFixed(1)}%)`);

  // 5. Detalles de sets sin cartas
  const setsNoCards = await database.query(`
    SELECT s.id, s.name, COUNT(c.id) as card_count
    FROM sets s
    LEFT JOIN cards c ON s.id = c.set_id
    WHERE s.language = 'ja'
    GROUP BY s.id, s.name
    HAVING COUNT(c.id) = 0
    LIMIT 10
  `);

  console.log(`\n\n⚠️  Sets SIN cartas (primeros 10):`);
  setsNoCards.rows.forEach((row: any) => {
    console.log(`   - ${row.name}`);
  });

  // 6. Top 5 sets con más cartas
  const topSets = await database.query(`
    SELECT s.name, COUNT(c.id) as card_count
    FROM sets s
    LEFT JOIN cards c ON s.id = c.set_id
    WHERE s.language = 'ja'
    GROUP BY s.id, s.name
    ORDER BY COUNT(c.id) DESC
    LIMIT 5
  `);

  console.log(`\n\n✅ Top 5 sets con más cartas:`);
  topSets.rows.forEach((row: any) => {
    console.log(`   - ${row.name}: ${row.card_count} cartas`);
  });

  console.log('\n' + '═'.repeat(80) + '\n');

  process.exit(0);
}

checkCardSync();
