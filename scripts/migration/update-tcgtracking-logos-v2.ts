/**
 * Script: Actualizar logos de sets japoneses con MEJOR selección de imágenes
 * Usa priorización inteligente: Official Collection > Booster Box > Trainer Box
 */

import * as dotenv from 'dotenv';
import axios from 'axios';
import { database } from '../src/db/database';

dotenv.config();

async function updateTCGTrackingLogos() {
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║  UPDATING TCGTRACKING SET LOGOS - INTELLIGENT SELECTION              ║');
  console.log('╚' + '═'.repeat(78) + '╝\n');

  try {
    await database.connect();
    console.log('✅ Database connected\n');

    // 1. Obtener todos los sets sin logos
    const query = `
      SELECT DISTINCT s.id, s.name, ser.external_id
      FROM sets s
      INNER JOIN set_external_refs ser ON s.id = ser.set_id
      WHERE ser.source_code = 'tcgtracking'
        AND (s.logo_image_url IS NULL OR s.logo_image_url = '')
      ORDER BY s.name
    `;

    const result = await database.query(query);
    const setsToUpdate = result.rows;

    console.log(`📦 Found ${setsToUpdate.length} sets without logos\n`);
    
    if (setsToUpdate.length === 0) {
      console.log('✅ All sets already have logos!');
      process.exit(0);
    }

    let updated = 0;
    let errors = 0;
    let skipped = 0;

    // 2. Procesar cada set
    for (let i = 0; i < setsToUpdate.length; i++) {
      const set = setsToUpdate[i];
      const progress = `[${i + 1}/${setsToUpdate.length}]`;
      
      process.stdout.write(`\r${progress} Processing ${set.name}...`);

      try {
        // Obtener productos del set
        const apiResponse = await axios.get(
          `https://tcgtracking.com/tcgapi/v1/85/sets/${set.external_id}`
        );

        const products = apiResponse.data.products || [];

        if (products.length === 0) {
          skipped++;
          continue;
        }

        const nameLC = (p: any) => (p.name || '').toLowerCase();

        // Aplicar priorización inteligente
        let bestImage = null;

        // 1. Official Collection
        bestImage = products
          .find((p: any) => nameLC(p).includes('official') && nameLC(p).includes('collection'))
          ?.image_url;

        // 2. Booster Box
        if (!bestImage) {
          bestImage = products
            .find((p: any) => nameLC(p).includes('booster') && nameLC(p).includes('box'))
            ?.image_url;
        }

        // 3. Elite Trainer Box
        if (!bestImage) {
          bestImage = products
            .find((p: any) => nameLC(p).includes('elite') || (nameLC(p).includes('trainer') && nameLC(p).includes('box')))
            ?.image_url;
        }

        // 4. Premium Collection
        if (!bestImage) {
          bestImage = products
            .find((p: any) => nameLC(p).includes('premium'))
            ?.image_url;
        }

        // 5. Any booster/box
        if (!bestImage) {
          bestImage = products
            .find((p: any) => nameLC(p).includes('booster') || nameLC(p).includes('box'))
            ?.image_url;
        }

        // 6. Fallback: any image
        if (!bestImage) {
          bestImage = products.find((p: any) => p.image_url)?.image_url;
        }

        if (!bestImage) {
          skipped++;
          continue;
        }

        // Actualizar en BD
        await database.query(
          `UPDATE sets 
           SET logo_image_url = $1, symbol_image_url = $1, updated_at = NOW()
           WHERE id = $2`,
          [bestImage, set.id]
        );

        updated++;

      } catch (error: any) {
        if (error.response?.status !== 404) {
          errors++;
        } else {
          skipped++;
        }
      }
    }

    console.log('\n\n' + '═'.repeat(80));
    console.log('📊 RESULTS:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('═'.repeat(80) + '\n');

  } catch (error: any) {
    console.error('Fatal error:', error.message);
  } finally {
    process.exit(0);
  }
}

updateTCGTrackingLogos();
