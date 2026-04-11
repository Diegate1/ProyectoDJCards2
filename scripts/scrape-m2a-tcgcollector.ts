import axios from 'axios';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import { database } from '../src/db/database';
import { randomUUID } from 'crypto';

dotenv.config();

interface ScrapedSet {
  sourceSite: 'tcgcollector';
  sourceSetUrl: string;
  setName: string;
  setCode: string;
  releaseDate: string | null;
  releaseDateRaw: string | null;
  language: 'ja';
  country: 'jp';
}

interface ScrapedCard {
  sourceSite: 'tcgcollector';
  sourceCardUrl: string | null;
  nameEn: string | null;
  nameJp: string | null;
  number: string | null;
  setTotal: string | null;
  numberDisplay: string | null;
  expansionName: string | null;
  setCode: string | null;
  rarity: string | null;
  illustrator: string | null;
  imageUrl: string | null;
}

// Utilidades de limpieza de texto
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function dedupeRepeatedText(text: string): string {
  // Eliminar duplicados consecutivos: "XXX XXX" -> "XXX"
  const parts = text.split(/\s+/);
  const result = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] !== parts[i - 1]) {
      result.push(parts[i]);
    }
  }
  return result.join(' ');
}

function clean(text: string | null | undefined): string | null {
  if (!text) return null;
  const cleaned = normalizeWhitespace(dedupeRepeatedText(text));
  return cleaned || null;
}

function splitSetNameAndCode(input: string): { setName: string; setCode: string } {
  // Separar "MEGA Dream exM2a" en "MEGA Dream ex" y "M2a"
  // Regex: buscar códigos de set típicos al final
  const codePattern = /([A-Z]\d[A-Za-z]*)\s*$/;
  const match = input.match(codePattern);
  
  if (match) {
    const code = match[1];
    const name = input.substring(0, match.index).trim();
    return { setName: name, setCode: code };
  }
  
  // Si no coincide, devolver como es
  return { setName: input, setCode: '' };
}

function parseDate(dateStr: string): { date: string | null; raw: string } {
  // Convertir "Nov 28, 2025" a "2025-11-28"
  const raw = dateStr;
  const months: { [key: string]: string } = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  
  try {
    const match = dateStr.match(/(\w+)\s+(\d+),\s+(\d{4})/i);
    if (match) {
      const [, monthStr, day, year] = match;
      const month = months[monthStr.toLowerCase().substring(0, 3)];
      if (month) {
        return {
          date: `${year}-${month}-${day.padStart(2, '0')}`,
          raw,
        };
      }
    }
  } catch (error) {
    console.warn(`Warning parsing date: ${dateStr}`);
  }
  
  return { date: null, raw };
}

function parseCardNumber(numberStr: string): { number: string | null; setTotal: string | null; numberDisplay: string } {
  // Convertir "044/193" a { number: "044", setTotal: "193", numberDisplay: "044/193" }
  const match = numberStr.match(/^(\d+)\/(\d+)$/);
  if (match) {
    return {
      number: match[1],
      setTotal: match[2],
      numberDisplay: numberStr,
    };
  }
  return {
    number: numberStr,
    setTotal: null,
    numberDisplay: numberStr,
  };
}

class TcgCollectorScraper {
  private client = axios.create({
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0',
    },
  });

  async scrapeSet(setCode: string, setUrl: string): Promise<ScrapedSet | null> {
    console.log(`\n🔍 Fetching set URL: ${setUrl}`);
    
    try {
      // Agregar un pequeño delay y reintento
      let response;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          // Delay progresivo
          await new Promise(resolve => setTimeout(resolve, 1000 + attempts * 2000));
          response = await this.client.get(setUrl);
          break;
        } catch (error: any) {
          attempts++;
          if (error.response?.status === 403 && attempts < maxAttempts) {
            console.log(`  ⚠️ Got 403 Forbidden, retrying (${attempts}/${maxAttempts})...`);
            continue;
          }
          throw error;
        }
      }

      const $ = cheerio.load(response!.data);

      // Buscar el nombre del set en el H1 o título
      const titleText = $('h1, .set-title, [class*="title"]').first().text() || '';
      const { setName, setCode: extractedCode } = splitSetNameAndCode(clean(titleText) || setCode);

      // Buscar la fecha de lanzamiento
      const releaseDateRaw = $('[class*="release"], [data-release]').first().text();
      const dateInfo = parseDate(clean(releaseDateRaw) || '');

      const set: ScrapedSet = {
        sourceSite: 'tcgcollector',
        sourceSetUrl: setUrl,
        setName: clean(setName) || setCode,
        setCode: extractedCode || setCode,
        releaseDate: dateInfo.date,
        releaseDateRaw: dateInfo.raw || releaseDateRaw || null,
        language: 'ja',
        country: 'jp',
      };

      console.log(`✓ Set scraped: ${set.setName} (${set.setCode})`);
      return set;
    } catch (error) {
      console.error(`✗ Error scraping set:`, error);
      return null;
    }
  }

  async scrapeSetCards(setUrl: string): Promise<ScrapedCard[]> {
    console.log(`\n🃏 Fetching cards from: ${setUrl}`);
    
    try {
      const response = await this.client.get(setUrl);
      const $ = cheerio.load(response.data);

      const cards: ScrapedCard[] = [];

      // Buscar contenedores de cartas
      $('[class*="card"], [class*="Card"], li[class*="item"]').each((index, element) => {
        const $card = $(element);

        // Extraer datos de la carta
        const nameEn = clean($card.find('[class*="name"], .card-title').first().text());
        const numberDisplay = clean($card.find('[class*="number"], .card-number').first().text());
        const rarity = clean($card.find('[class*="rarity"]').first().text());
        const illustrator = clean($card.find('[class*="illustrator"], [class*="artist"]').first().text());
        const expansionText = clean($card.find('[class*="expansion"], [class*="set"]').first().text());

        // Parseamos el número
        let cardNumber = null;
        let setTotal = null;
        let displayNumber = numberDisplay;

        if (numberDisplay) {
          const parsed = parseCardNumber(numberDisplay);
          cardNumber = parsed.number;
          setTotal = parsed.setTotal;
          displayNumber = parsed.numberDisplay;
        }

        // Extraer URL de imagen
        const imageUrl = $card.find('img').first().attr('src') || null;

        // Si tenemos al menos número y nombre, agregamos la carta
        if (numberDisplay && nameEn) {
          const card: ScrapedCard = {
            sourceSite: 'tcgcollector',
            sourceCardUrl: null,
            nameEn,
            nameJp: null,
            number: cardNumber,
            setTotal,
            numberDisplay: displayNumber,
            expansionName: expansionText,
            setCode: null,
            rarity,
            illustrator,
            imageUrl,
          };

          cards.push(card);
        }
      });

      console.log(`✓ Extracted ${cards.length} cards`);
      return cards;
    } catch (error) {
      console.error(`✗ Error scraping cards:`, error);
      return [];
    }
  }
}

async function syncM2aSet(): Promise<void> {
  const scraper = new TcgCollectorScraper();
  const setCode = 'M2a';
  const setUrl = 'https://www.tcgcollector.com/sets/11678/mega-dream-ex?setCardCountMode=anyCardVariant&releaseDateOrder=newToOld&displayAs=images';

  try {
    await database.connect();
    console.log('✓ Database connected\n');

    // Paso 1: Scrapear set
    const scrapedSet = await scraper.scrapeSet(setCode, setUrl);
    if (!scrapedSet) {
      throw new Error(`Failed to scrape set ${setCode}`);
    }

    // Paso 2: Upsert set
    console.log(`\n💾 Upserting set ${scrapedSet.setCode}...`);
    
    const existingSet = await database.query(
      `SELECT id FROM sets WHERE source_site = $1 AND set_code = $2 AND language = $3`,
      ['tcgcollector', scrapedSet.setCode, scrapedSet.language]
    );

    let setId: string;

    if (existingSet.rows.length > 0) {
      setId = existingSet.rows[0].id;
      console.log(`  ↻ Set exists, updating...`);
      await database.query(
        `UPDATE sets SET name = $1, release_date = $2, metadata = $3, updated_at = NOW()
         WHERE id = $4`,
        [
          scrapedSet.setName,
          scrapedSet.releaseDate,
          JSON.stringify({
            source_site: scrapedSet.sourceSite,
            source_url: scrapedSet.sourceSetUrl,
            release_date_raw: scrapedSet.releaseDateRaw,
          }),
          setId,
        ]
      );
    } else {
      setId = randomUUID();
      console.log(`  ✓ Inserting new set...`);
      await database.query(
        `INSERT INTO sets (id, canonical_code, name, series, release_date, language, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          setId,
          `tcgcollector:${scrapedSet.setCode}`,
          scrapedSet.setName,
          null,
          scrapedSet.releaseDate,
          scrapedSet.language,
          JSON.stringify({
            source_site: scrapedSet.sourceSite,
            source_url: scrapedSet.sourceSetUrl,
            release_date_raw: scrapedSet.releaseDateRaw,
            country: scrapedSet.country,
          }),
        ]
      );

      // Registrar en external_refs
      await database.query(
        `INSERT INTO set_external_refs (set_id, source_code, external_id, external_code, external_name, language, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [setId, 'tcgcollector', scrapedSet.setCode, scrapedSet.setCode, scrapedSet.setName, scrapedSet.language]
      );
    }

    // Paso 3: Scrapear cartas
    const scrapedCards = await scraper.scrapeSetCards(setUrl);

    // Paso 4: Upsert cartas
    console.log(`\n💾 Upserting ${scrapedCards.length} cards...`);
    let cardsInserted = 0;
    let cardsUpdated = 0;

    for (const card of scrapedCards) {
      try {
        const existingCard = await database.query(
          `SELECT id FROM cards WHERE set_id = $1 AND number = $2`,
          [setId, card.numberDisplay]
        );

        if (existingCard.rows.length > 0) {
          // Actualizar
          await database.query(
            `UPDATE cards SET name = $1, rarity = $2, metadata = $3, updated_at = NOW() WHERE id = $4`,
            [
              card.nameEn,
              card.rarity,
              JSON.stringify({
                source_site: card.sourceSite,
                illustrator: card.illustrator,
                image_url: card.imageUrl,
              }),
              existingCard.rows[0].id,
            ]
          );
          cardsUpdated++;
        } else {
          // Insertar
          const cardId = randomUUID();
          await database.query(
            `INSERT INTO cards (id, set_id, canonical_card_code, number, name, rarity, metadata, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
            [
              cardId,
              setId,
              `${scrapedSet.setCode}-${card.numberDisplay}`,
              card.numberDisplay,
              card.nameEn,
              card.rarity,
              JSON.stringify({
                source_site: card.sourceSite,
                source_url: card.sourceCardUrl,
                illustrator: card.illustrator,
                image_url: card.imageUrl,
              }),
            ]
          );
          cardsInserted++;

          // Registrar en external_refs
          await database.query(
            `INSERT INTO card_external_refs (card_id, source_code, external_id, local_number, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [cardId, 'tcgcollector', `${scrapedSet.setCode}-${card.numberDisplay}`, card.number]
          );
        }
      } catch (error) {
        console.warn(`  ⚠️ Error upserting card ${card.numberDisplay}:`, (error as Error).message);
      }
    }

    console.log(`\n✅ Sync Complete!`);
    console.log(`  Cards Inserted: ${cardsInserted}`);
    console.log(`  Cards Updated: ${cardsUpdated}`);

    // Verificar
    const count = await database.query(
      `SELECT COUNT(*) as total FROM cards WHERE set_id = $1`,
      [setId]
    );
    console.log(`\n📊 Set ${scrapedSet.setCode} now has ${count.rows[0].total} cards in database`);

    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await database.close();
    process.exit(1);
  }
}

syncM2aSet();
