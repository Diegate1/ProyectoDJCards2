import * as dotenv from 'dotenv';
import { database } from '../src/db/database';
import { randomUUID } from 'crypto';

dotenv.config();

/**
 * Carga inicial del set M2a (MEGA Dream ex) con datos de ejemplo
 * Basado en la especificación en CargaConScraping.md
 */

interface M2aCardData {
  number: string;
  numberDisplay: string;
  setTotal: string;
  nameEn: string;
  illustrator: string | null;
  rarity: string | null;
}

// Datos de ejemplo del documento
const M2A_SET_DATA = {
  name: 'MEGA Dream ex',
  code: 'M2a',
  sourceUrl: 'https://www.tcgcollector.com/sets/11678/mega-dream-ex',
  releaseDate: '2025-11-28',
  releaseDateRaw: 'Nov 28, 2025',
  totalCards: 193,
};

// Cartas de ejemplo del documento + algunas adicionales
const M2A_CARDS: M2aCardData[] = [
  {
    number: '044',
    numberDisplay: '044/193',
    setTotal: '193',
    nameEn: 'Pikachu ex',
    illustrator: 'aky CG Works',
    rarity: 'Double Rare (RR)',
  },
  {
    number: '001',
    numberDisplay: '001/193',
    setTotal: '193',
    nameEn: 'Bulbasaur',
    illustrator: null,
    rarity: null,
  },
  {
    number: '002',
    numberDisplay: '002/193',
    setTotal: '193',
    nameEn: 'Ivysaur',
    illustrator: null,
    rarity: null,
  },
  {
    number: '003',
    numberDisplay: '003/193',
    setTotal: '193',
    nameEn: 'Venusaur',
    illustrator: null,
    rarity: null,
  },
  {
    number: '004',
    numberDisplay: '004/193',
    setTotal: '193',
    nameEn: 'Charmander',
    illustrator: null,
    rarity: null,
  },
  {
    number: '005',
    numberDisplay: '005/193',
    setTotal: '193',
    nameEn: 'Charmeleon',
    illustrator: null,
    rarity: null,
  },
  {
    number: '006',
    numberDisplay: '006/193',
    setTotal: '193',
    nameEn: 'Charizard',
    illustrator: null,
    rarity: null,
  },
  // Más cartas...
];

async function loadM2aSet(): Promise<void> {
  try {
    await database.connect();
    console.log('✓ Database connected\n');

    console.log(`📚 Loading set ${M2A_SET_DATA.code} - ${M2A_SET_DATA.name}...`);

    // Paso 1: Verificar y cargar el set
    const canonicalCode = `tcgcollector:${M2A_SET_DATA.code}`;
    const existingSet = await database.query(
      `SELECT id FROM sets WHERE canonical_code = $1`,
      [canonicalCode]
    );

    let setId: string;

    if (existingSet.rows.length > 0) {
      setId = existingSet.rows[0].id;
      console.log(`  ↻ Set already exists`);
    } else {
      setId = randomUUID();
      console.log(`  ✓ Inserting new set...`);
      
      await database.query(
        `INSERT INTO sets (id, canonical_code, name, series, release_date, printed_total, total, language, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [
          setId,
          canonicalCode,
          M2A_SET_DATA.name,
          'Sword & Shield', // Serie aproximada
          M2A_SET_DATA.releaseDate,
          M2A_SET_DATA.totalCards,
          M2A_SET_DATA.totalCards,
          'ja', // Japonés
          JSON.stringify({
            source_site: 'tcgcollector',
            source_url: M2A_SET_DATA.sourceUrl,
            release_date_raw: M2A_SET_DATA.releaseDateRaw,
            country: 'jp',
          }),
        ]
      );

      // Registrar en set_external_refs
      await database.query(
        `INSERT INTO set_external_refs (set_id, source_code, external_id, external_code, external_name, language, raw_json, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [setId, 'tcgcollector', M2A_SET_DATA.code, M2A_SET_DATA.code, M2A_SET_DATA.name, 'ja', JSON.stringify({ code: M2A_SET_DATA.code, name: M2A_SET_DATA.name })]
      );
    }

    // Paso 2: Cargar cartas
    console.log(`\n💾 Loading ${M2A_CARDS.length} cards...`);
    let cardsInserted = 0;
    let cardsUpdated = 0;
    let cardsSkipped = 0;

    for (const card of M2A_CARDS) {
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
              card.rarity || null,
              JSON.stringify({
                source_site: 'tcgcollector',
                illustrator: card.illustrator,
                manual_entry: true,
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
              `${M2A_SET_DATA.code}-${card.numberDisplay}`,
              card.numberDisplay,
              card.nameEn,
              card.rarity || null,
              JSON.stringify({
                source_site: 'tcgcollector',
                illustrator: card.illustrator,
                manual_entry: true,
                set_total: card.setTotal,
              }),
            ]
          );
          cardsInserted++;

          // Registrar en card_external_refs
          await database.query(
            `INSERT INTO card_external_refs (card_id, source_code, external_id, local_number, raw_json, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
            [cardId, 'tcgcollector', `${M2A_SET_DATA.code}-${card.numberDisplay}`, card.number, JSON.stringify(card)]
          );
        }
      } catch (error) {
        console.warn(`  ⚠️ Error loading card ${card.numberDisplay}:`, (error as Error).message);
        cardsSkipped++;
      }
    }

    console.log(`\n✅ Load Complete!`);
    console.log(`  Cards Inserted: ${cardsInserted}`);
    console.log(`  Cards Updated: ${cardsUpdated}`);
    console.log(`  Cards Skipped: ${cardsSkipped}`);

    // Verificar datos
    const countResult = await database.query(
      `SELECT COUNT(*) as total FROM cards WHERE set_id = $1`,
      [setId]
    );

    const setResult = await database.query(
      `SELECT name, release_date FROM sets WHERE id = $1`,
      [setId]
    );

    console.log(`\n📊 Set ${setResult.rows[0].name} loaded:`);
    console.log(`  Release Date: ${setResult.rows[0].release_date}`);
    console.log(`  Total Cards: ${countResult.rows[0].total}`);

    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await database.close();
    process.exit(1);
  }
}

loadM2aSet();
