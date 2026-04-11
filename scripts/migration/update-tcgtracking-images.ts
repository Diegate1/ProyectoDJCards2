import * as dotenv from 'dotenv';
import { database } from '../src/db/database';
import { tcgtrackingClient } from '../src/modules/tcgtracking/tcgtracking.client';

dotenv.config();

async function updateSetImages() {
  try {
    console.log('='.repeat(80));
    console.log('UPDATING TCGTracking SET IMAGES');
    console.log('='.repeat(80));

    await database.connect();
    console.log('✓ Database connected\n');

    // Obtener todos los sets de TCGTracking sin imagen
    console.log('1️⃣  Fetching sets without images...');
    const setsResult = await database.query(`
      SELECT 
        ref.external_id,
        s.id,
        s.name
      FROM set_external_refs ref
      JOIN sets s ON ref.set_id = s.id
      WHERE ref.source_code = 'tcgtracking'
        AND (s.logo_image_url IS NULL OR s.symbol_image_url IS NULL)
    `);

    const sets = setsResult.rows;
    console.log(`  Found ${sets.length} sets without images\n`);

    let updated = 0;
    let errors = 0;

    for (const set of sets) {
      try {
        const externalId = parseInt(set.external_id, 10);
        
        console.log(`2️⃣  Getting image for ${set.name} (ID: ${externalId})...`);
        const image = await tcgtrackingClient.getSetImage(externalId);
        
        if (image) {
          console.log(`  ✓ Image found: ${image.substring(0, 50)}...`);
          
          const updateSql = `
            UPDATE sets
            SET 
              logo_image_url = $1,
              symbol_image_url = $1,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `;
          
          await database.query(updateSql, [image, set.id]);
          updated++;
          console.log(`  ✓ Updated in DB\n`);
        } else {
          console.log(`  ⚠️  No image available\n`);
        }
      } catch (error) {
        console.error(`  ✗ Error:`, (error as Error).message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Update complete - Updated: ${updated}, Errors: ${errors}`);
    console.log('='.repeat(80));

    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await database.close();
    process.exit(1);
  }
}

updateSetImages();
