/**
 * Carga completa de M2a (MEGA Dream ex) - 193 cartas
 * con scraping agresivo desde TCG Collector y delays para evitar bloqueos
 */

import * as https from 'https';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { database } from '../src/db/database';
import * as dotenv from 'dotenv';

dotenv.config();

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  keepAliveMsecs: 5000,
  timeout: 30000,
});

// User-Agents variados para evitar bloqueos
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
];

let requestCount = 0;

const axiosInstance = axios.create({
  httpsAgent,
  timeout: 30000,
  maxRedirects: 5,
});

const TCG_COLLECTOR_BASE = 'https://www.tcgcollector.com';

// Delay con rango aleatorio
async function delay(minMs: number, maxMs: number) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise(resolve => setTimeout(resolve, ms));
}

// Random User-Agent
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

interface CardData {
  number: string;
  name: string;
  imageUrl: string | null;
  rarity: string | null;
  hp: string | null;
  type: string | null;
}

/**
 * Extraer datos de carta desde TCG Collector con reintentos
 */
async function scrapeCardPage(cardNumber: string, retries: number = 3): Promise<CardData | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const paddedNumber = cardNumber.padStart(3, '0');
      const url = `${TCG_COLLECTOR_BASE}/pokemon/MEGA%20Dream%20ex/M2a/${paddedNumber}`;

      const config = {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Referer': `${TCG_COLLECTOR_BASE}/pokemon/MEGA%20Dream%20ex`,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'DNT': '1',
          'Cache-Control': 'max-age=0',
        },
      };

      const response = await axiosInstance.get(url, config);
      const $ = cheerio.load(response.data);

      // Extraer nombre
      const pageTitle = $('h1').first().text().trim() ||
                       $('title').text().split('|')[0].trim() ||
                       '';
      const name = pageTitle.replace(/\s*M2a\s*$/, '').trim() || 'Unknown';

      // Extraer imagen
      let imageUrl: string | null = null;
      const imgSrc = $('img.card-image').attr('src') ||
                     $('div.card-image img').attr('src') ||
                     $('img[alt*="card"]').attr('src') ||
                     $('#card-image').attr('src') ||
                     $('img[class*="card"]').first().attr('src');

      if (imgSrc) {
        imageUrl = imgSrc.startsWith('/') ? TCG_COLLECTOR_BASE + imgSrc : imgSrc;
      }

      // Extraer rareza
      const rarityText = $('span.rarity, span[class*="rarity"], td:contains("Rarity")').text() ||
                        $('*:contains("Rarity")').next().text() || null;
      const rarity = rarityText?.trim() || null;

      // Extraer HP
      const hpText = $('span.hp, span[class*="hp"], td:contains("HP")').text() ||
                    $('*:contains("HP")').next().text() || null;
      const hp = hpText?.match(/\d+/)?.[0] || null;

      // Extraer tipo
      const typeText = $('span.type, span[class*="type"], td:contains("Type")').text() ||
                      $('*:contains("Type")').next().text() || null;
      const type = typeText?.trim() || null;

      if (attempt === 1) {
        process.stdout.write(`    ✓`);
      }

      return {
        number: `${paddedNumber}/193`,
        name: name || `Card ${paddedNumber}`,
        imageUrl,
        rarity,
        hp,
        type,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 403) {
          process.stdout.write(`⏳`);
          // 403: esperar más y reintentar
          if (attempt < retries) {
            await delay(20000, 40000);
          }
        } else if (status === 429) {
          process.stdout.write(`⏱️`);
          // 429: Too Many Requests - esperar bastante
          if (attempt < retries) {
            await delay(45000, 90000);
          }
        } else if (status === 404) {
          return null; // Carta no existe
        } else {
          process.stdout.write(`⚠️`);
          if (attempt < retries) {
            await delay(15000, 30000);
          }
        }
      } else {
        process.stdout.write(`❌`);
        if (attempt < retries) {
          await delay(2000, 5000);
        }
      }
    }
  }

  return null;
}

/**
 * Cargar todas las cartas de M2a (001-193)
 */
async function loadM2aComplete() {
  console.log('🎴 M2a Complete Load - MEGA Dream ex (193 cards)\n');

  try {
    // Conectar a BD
    console.log('📚 Connecting to database...');
    const connectionTest = await database.query('SELECT 1');
    if (!connectionTest.rows[0]) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connected\n');

    // Obtener set M2a
    console.log('🔍 Getting M2a set...');
    const setResult = await database.query(
      `SELECT id FROM sets WHERE name LIKE '%MEGA Dream%' LIMIT 1`
    );

    if (setResult.rows.length === 0) {
      throw new Error('M2a set not found in database');
    }

    const setId = setResult.rows[0].id;
    console.log(`✅ Found set ID: ${setId}\n`);

    // Limpiar cartas previas para recargar
    console.log('🗑️  Clearing previous M2a cards...');
    await database.query('DELETE FROM cards WHERE set_id = $1', [setId]);
    console.log('✅ Cleared\n');

    // Scrapear todas las 193 cartas
    console.log('🕷️  Scraping all 193 cards from TCG Collector...');
    console.log('(Este proceso puede tomar 1-2 horas debido a los delays de 30s)\n');

    const allCards: CardData[] = [];
    let successCount = 0;
    let skipCount = 0;

    for (let i = 1; i <= 193; i++) {
      const cardNum = String(i).padStart(3, '0');
      process.stdout.write(`[${String(i).padStart(3, '0')}/193] `);

      const cardData = await scrapeCardPage(String(i));

      if (cardData) {
        allCards.push(cardData);
        successCount++;
        process.stdout.write(` ✅ ${cardData.name}\n`);
      } else {
        skipCount++;
        process.stdout.write(` ⊝ Skipped\n`);
      }

      // Delay entre requests: 25-35 segundos
      if (i < 193) {
        await delay(25000, 35000);
      }

      // Cada 50 cartas, mostrar progreso
      if (i % 50 === 0) {
        console.log(`\n📊 Progress: ${i}/193 scraped, ${successCount} valid\n`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Scraping complete: ${successCount} cards found`);
    console.log(`⊝ Skipped: ${skipCount}`);
    console.log('='.repeat(60) + '\n');

    // Insertar en BD
    console.log('💾 Inserting cards into database...');
    let insertedCount = 0;

    for (const card of allCards) {
      try {
        const cardId = require('crypto').randomUUID();

        await database.query(
          `INSERT INTO cards (
            id, set_id, number, name, 
            image_small_url, image_large_url,
            rarity, hp, type,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
          [
            cardId,
            setId,
            card.number,
            card.name,
            card.imageUrl,
            card.imageUrl,
            card.rarity,
            card.hp,
            card.type,
          ]
        );

        insertedCount++;

        // Registrar external ref
        await database.query(
          `INSERT INTO card_external_refs (
            id, card_id, source_code, external_id, 
            raw_json, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [
            require('crypto').randomUUID(),
            cardId,
            'tcgcollector',
            `M2a-${card.number.split('/')[0]}`,
            JSON.stringify({ source: 'tcgcollector', url: `${TCG_COLLECTOR_BASE}/pokemon/MEGA%20Dream%20ex/M2a/${card.number.split('/')[0]}` }),
          ]
        );
      } catch (error) {
        console.error(`  ❌ Failed to insert ${card.name}: ${(error as Error).message}`);
      }
    }

    console.log(`✅ Inserted: ${insertedCount} cards\n`);

    // Resumen final
    console.log('='.repeat(60));
    console.log('📊 Final Summary:');
    console.log(`  Total Scraped: ${successCount}`);
    console.log(`  Inserted to DB: ${insertedCount}`);
    console.log(`  Skipped: ${skipCount}`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', (error as Error).message);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
loadM2aComplete();
