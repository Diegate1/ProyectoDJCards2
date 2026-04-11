import * as dotenv from 'dotenv';
import { database } from '../src/db/database';
import { tcgtrackingClient } from '../src/modules/tcgtracking/tcgtracking.client';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function syncSingleSet() {
  try {
    console.log('='.repeat(80));
    console.log('SYNCING SINGLE SET: M4: Ninja Spinner');
    console.log('='.repeat(80));

    await database.connect();
    console.log('✓ Database connected\n');

    // 1. Obtener el set M4: Ninja Spinner (ID: 24653)
    const setId = 24653;
    console.log(`1️⃣  Fetching set ${setId} from API...`);
    
    try {
      const response = await tcgtrackingClient.getCardsBySet(setId);
      console.log(`\n✓ API Response received`);
      console.log(`  - Type of response: ${typeof response}`);
      console.log(`  - Is array: ${Array.isArray(response)}`);
      console.log(`  - Length: ${response.length}`);
      
      if (response.length > 0) {
        console.log(`\n✓ First card structure:`);
        console.log(JSON.stringify(response[0], null, 2));
      }

      // 2. Obtener el set interno
      console.log(`\n2️⃣  Looking up set in database...`);
      const setResult = await database.query(
        `SELECT set_id FROM set_external_refs 
         WHERE source_code = $1 AND external_id = $2`,
        ['tcgtracking', setId.toString()]
      );

      if (setResult.rows.length === 0) {
        throw new Error(`Set ${setId} not found in database references`);
      }

      const internalSetId = setResult.rows[0].set_id;
      console.log(`  ✓ Internal Set ID: ${internalSetId}`);

      // 3. Procesar cada carta
      console.log(`\n3️⃣  Processing ${response.length} cards...`);
      let synced = 0;
      let errors = 0;

      for (const card of response) { // Todas las cartas
        try {
          // Log solo cada 20 cartas para no saturar consola
          if (synced % 20 === 0) {
            console.log(`  [${synced}/${response.length}] ${card.number} - ${card.name || card.clean_name}`);
          }
          const existingRefResult = await database.query(
            `SELECT card_id FROM card_external_refs 
             WHERE source_code = $1 AND external_id = $2`,
            ['tcgtracking', card.id.toString()]
          );

          let cardId: string;
          if (existingRefResult.rows.length > 0) {
            cardId = existingRefResult.rows[0].card_id;
          } else {
            cardId = uuidv4();
          }

          // Upsert en la tabla cards
          const cardSql = `
            INSERT INTO cards (
              id, set_id, canonical_card_code, number, name,
              supertype, rarity, artist, hp, flavor_text,
              image_small_url, image_large_url,
              metadata, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (set_id, number, name) DO UPDATE SET
              rarity = EXCLUDED.rarity,
              image_small_url = EXCLUDED.image_small_url,
              metadata = EXCLUDED.metadata,
              updated_at = CURRENT_TIMESTAMP
            RETURNING id
          `;

          const cardResult = await database.query(cardSql, [
            cardId,
            internalSetId,
            `tcgtracking-${card.number}`,
            card.number,
            card.name || card.clean_name,
            'Pokemon', // supertype
            card.rarity || null,
            null, // artist not available
            null, // hp not available
            null, // flavor_text not available
            card.image_url || null,
            card.image_url || null,
            JSON.stringify({
              tcgplayer_id: card.id,
              tcgplayer_url: card.tcgplayer_url,
              image_count: card.image_count,
            }),
          ]);

          const finalCardId = cardResult.rows[0].id;

          // Upsert en card_external_refs
          const refSql = `
            INSERT INTO card_external_refs (
              card_id, source_code, external_id, raw_json, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (source_code, external_id) DO UPDATE SET
              card_id = EXCLUDED.card_id,
              raw_json = EXCLUDED.raw_json,
              updated_at = CURRENT_TIMESTAMP
          `;

          await database.query(refSql, [
            finalCardId,
            'tcgtracking',
            card.id.toString(),
            JSON.stringify(card),
          ]);

          synced++;
        } catch (error) {
          console.error(`    ✗ Error:`, (error as Error).message);
          errors++;
        }
      }

      console.log(`\n✅ Sync complete for first 3 cards`);
      console.log(`   Synced: ${synced}, Errors: ${errors}`);
      console.log('='.repeat(80));

    } catch (error) {
      console.error(`\n❌ Error:`, (error as Error).message);
      console.error(`Stack:`, (error as Error).stack);
    }

    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await database.close();
    process.exit(1);
  }
}

syncSingleSet();
