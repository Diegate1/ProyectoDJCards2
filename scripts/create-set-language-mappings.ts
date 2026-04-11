import * as dotenv from 'dotenv';
import { database } from '../src/db/database';

dotenv.config();

/**
 * Crea asignaciones de sets entre idiomas basándose en metadata (serieId)
 * La idea es vincular sets japoneses con sus equivalentes en inglés
 */
async function createSetLanguageMappings() {
  try {
    await database.connect();
    console.log('✓ Database connected\n');

    // Obtener todos los sets con sus metadatos
    const setsResult = await database.query(`
      SELECT 
        s.id,
        s.name,
        s.language,
        s.canonical_code,
        s.metadata,
        ser.external_id,
        ser.raw_json
      FROM sets s
      LEFT JOIN set_external_refs ser ON s.id = ser.set_id AND ser.source_code = 'tcgdex'
      ORDER BY s.language, s.name
    `);

    const sets = setsResult.rows;
    console.log(`Found ${sets.length} total sets`);

    // Crear un mapa de serieId para cada idioma
    const serieMap: { [key: string]: { [key: string]: string[] } } = {
      ja: {},
      en: {},
    };

    for (const set of sets) {
      if (!['ja', 'en'].includes(set.language)) continue;

      const metadata = set.metadata ? JSON.parse(set.metadata) : {};
      const serieId = metadata.serieId || set.canonical_code?.split(':')[1];

      if (!serieId) {
        console.log(`⚠️ No serieId found for ${set.language}: ${set.name}`);
        continue;
      }

      if (!serieMap[set.language][serieId]) {
        serieMap[set.language][serieId] = [];
      }
      serieMap[set.language][serieId].push(set.id);
    }

    console.log('\n📊 Series found:');
    console.log(`   Japanese: ${Object.keys(serieMap.ja).length} series`);
    console.log(`   English: ${Object.keys(serieMap.en).length} series`);

    // Crear tabla de mapeos si no existe
    await database.query(`
      CREATE TABLE IF NOT EXISTS set_language_mappings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        set_id_source UUID NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
        set_id_target UUID NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
        source_language VARCHAR(10) NOT NULL,
        target_language VARCHAR(10) NOT NULL,
        confidence DECIMAL(3,2) DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(set_id_source, set_id_target)
      );
    `);
    console.log('\n✓ Mappings table ready');

    // Limpiar mapeos existentes
    await database.query('TRUNCATE set_language_mappings');
    let mappingCount = 0;

    // Crear mapeos: para cada serie en japonés, mapearla a inglés
    for (const serieId of Object.keys(serieMap.ja)) {
      const jaSetIds = serieMap.ja[serieId];
      const enSetIds = serieMap.en[serieId];

      if (!enSetIds || enSetIds.length === 0) {
        console.log(`ℹ️ No English equivalent for series ${serieId}`);
        continue;
      }

      // Mapear el último set en japonés al primer set en inglés
      // (generalmente hay solo 1 por serie, pero manejamos múltiples)
      for (const jaSetId of jaSetIds) {
        for (const enSetId of enSetIds) {
          try {
            await database.query(
              `INSERT INTO set_language_mappings (
                set_id_source, set_id_target, source_language, target_language, confidence
              ) VALUES ($1, $2, $3, $4, $5)`,
              [jaSetId, enSetId, 'ja', 'en', 1.0]
            );
            mappingCount++;
          } catch (error: any) {
            if (!error.message.includes('duplicate')) {
              throw error;
            }
          }
        }
      }
    }

    console.log(`✓ Created ${mappingCount} set language mappings\n`);

    // Mostrar algunos ejemplos
    const examples = await database.query(`
      SELECT 
        sja.name as ja_name,
        sen.name as en_name,
        sja.language as ja_lang,
        sen.language as en_lang
      FROM set_language_mappings m
      JOIN sets sja ON m.set_id_source = sja.id
      JOIN sets sen ON m.set_id_target = sen.id
      WHERE m.source_language = 'ja' AND m.target_language = 'en'
      LIMIT 10
    `);

    console.log('📋 Example mappings:');
    for (const ex of examples.rows) {
      console.log(`   🇯🇵 ${ex.ja_name} → 🇬🇧 ${ex.en_name}`);
    }

    await database.close();
    console.log('\n✅ Mappings created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await database.close();
    process.exit(1);
  }
}

createSetLanguageMappings();
