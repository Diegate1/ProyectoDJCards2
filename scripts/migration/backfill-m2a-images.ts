/**
 * Backfill de URLs de imagen para el set M2a desde TCG Collector
 * 
 * Procedimiento:
 * 1. Obtener cartas del set M2a sin image_small_url
 * 2. Para cada carta, construir URL de ficha en TCG Collector
 * 3. Hacer scraping de la imagen principal
 * 4. Actualizar cards.image_small_url y cards.image_large_url
 */

import * as https from 'https';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { database } from '../src/db/database';
import * as dotenv from 'dotenv';

dotenv.config();

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const axiosInstance = axios.create({
  httpsAgent,
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
});

const TCG_COLLECTOR_BASE = 'https://www.tcgcollector.com';

interface CardRow {
  id: string;
  name: string;
  number: string;
  set_id: string;
}

interface ImageData {
  small: string;
  large: string;
}

/**
 * Extraer URL de imagen desde la ficha de la carta en TCG Collector
 */
async function extractImageFromCardPage(cardNumber: string): Promise<ImageData | null> {
  try {
    // M2a es el set code para "MEGA Dream ex"
    const url = `${TCG_COLLECTOR_BASE}/pokemon/MEGA%20Dream%20ex/M2a/${cardNumber}`;

    console.log(`  🔗 Scraping: ${url}`);

    const response = await axiosInstance.get(url);
    const $ = cheerio.load(response.data);

    // Buscar imagen principal
    // TCG Collector típicamente tiene: <img class="card-image" src="..." />
    let imageUrl = $('img.card-image').attr('src') ||
                   $('div.card-image img').attr('src') ||
                   $('img[alt*="card"]').attr('src') ||
                   $('#card-image').attr('src');

    if (!imageUrl) {
      console.log(`    ⚠️  No image found in HTML`);
      return null;
    }

    // Completar URL si es relativa
    if (imageUrl.startsWith('/')) {
      imageUrl = TCG_COLLECTOR_BASE + imageUrl;
    }

    console.log(`    ✅ Found: ${imageUrl.substring(0, 60)}...`);

    return {
      small: imageUrl,
      large: imageUrl, // TCG Collector generalmente usa la misma URL en ambos tamaños
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 403) {
        console.log(`    ❌ 403 Forbidden - TCG Collector blocking scraping`);
      } else if (error.response?.status === 404) {
        console.log(`    ❌ 404 Not Found - Card page doesn't exist`);
      } else {
        console.log(`    ❌ HTTP ${error.response?.status} - ${error.message}`);
      }
    } else {
      console.log(`    ❌ Error: ${(error as Error).message}`);
    }
    return null;
  }
}

/**
 * Backfill de imágenes para todas las cartas de M2a
 */
async function backfillM2aImages() {
  console.log('🖼️  Starting M2a image backfill...\n');

  try {
    // Conectar a BD
    console.log('📚 Connecting to database...');
    const connectionTest = await database.query('SELECT 1');
    if (!connectionTest.rows[0]) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connected\n');

    // Obtener cartas de M2a sin imágenes
    console.log('🔍 Fetching M2a cards without images...');
    const cardsResult = await database.query(
      `SELECT c.id, c.name, c.number
       FROM cards c
       INNER JOIN sets s ON c.set_id = s.id
       WHERE s.name LIKE '%MEGA Dream%' 
         AND (c.image_small_url IS NULL OR c.image_small_url = '')
       ORDER BY c.number`
    );

    const cards: CardRow[] = cardsResult.rows;
    console.log(`📋 Found ${cards.length} cards without images\n`);

    if (cards.length === 0) {
      console.log('✨ All M2a cards already have images!');
      process.exit(0);
    }

    // Procesar cada carta
    let updatedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const cardNum = card.number.split('/')[0]; // "044/193" → "044"

      console.log(`[${i + 1}/${cards.length}] Processing ${card.name} (${card.number})...`);

      // Extraer imagen
      const imageData = await extractImageFromCardPage(cardNum);

      if (imageData) {
        // Actualizar BD
        try {
          await database.query(
            `UPDATE cards 
             SET image_small_url = $1, 
                 image_large_url = $2,
                 updated_at = NOW()
             WHERE id = $3`,
            [imageData.small, imageData.large, card.id]
          );

          updatedCount++;
          console.log(`    💾 Updated\n`);
        } catch (err) {
          console.log(`    ⚠️  Database update failed: ${(err as Error).message}\n`);
          failedCount++;
        }
      } else {
        failedCount++;
        console.log('');
      }

      // Rate limiting: 1 segundo entre requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Resumen
    console.log('\n' + '='.repeat(50));
    console.log('📊 Backfill Summary:');
    console.log(`  ✅ Updated: ${updatedCount}`);
    console.log(`  ❌ Failed: ${failedCount}`);
    console.log('='.repeat(50) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', (error as Error).message);
    process.exit(1);
  }
}

// Ejecutar
backfillM2aImages();
