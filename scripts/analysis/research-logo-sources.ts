/**
 * Script: Obtener logos desde TCGdex para sets japoneses
 * TCGdex es una fuente muy buena de logos de sets Pokemon
 */

import axios from 'axios';

async function getTCGdexSetImages() {
  console.log('🔍 Obteniendo datos de TCGdex para buscar logos...\n');

  try {
    // 1. Obtener TODAS las lineas de sets en TCGdex (que es más complet)
    console.log('1️⃣  Descargando todos los sets de TCGdex (Español)...');
    const tcgdexRes = await axios.get('https://api.tcgdex.net/v2/es/sets');
    const tcgdexSets = tcgdexRes.data;
    
    console.log(`   Found ${tcgdexSets.length} sets\n`);
    
    // Analizar estructura de un set
    console.log('📊 Analizando estructura de sets TCGdex:\n');
    
    if (tcgdexSets.length > 0) {
      const sample = tcgdexSets[0];
      console.log(`Sample set: ${JSON.stringify(sample, null, 2)}\n`);
      
      // Buscar propiedades que contengan URL
      console.log('Propiedades de imagen encontradas:');
      Object.entries(sample).forEach(([key, value]) => {
        const strValue = String(value);
        if (strValue.includes('http') || key.includes('image') || key.includes('logo')) {
          console.log(`  ✓ ${key}: ${strValue}`);
        }
      });
    }

    // 2. Buscar sets coincidentes con nombres como "Ninja Spinner", "Nihil Zero"
    console.log('\n\n📍 Buscando equivalencias con sets TCGTracking:\n');
    
    const japanSets = [
      { tcgtracking: 'M4', name: 'Ninja Spinner' },
      { tcgtracking: 'M3', name: 'Nihil Zero' },
      { tcgtracking: 'MP1', name: 'Start Deck 100 Battle Collection' },
    ];

    japanSets.forEach(jsSet => {
      const found = tcgdexSets.find((ts: any) => 
        ts.name?.toLowerCase().includes(jsSet.name.toLowerCase()) ||
        ts.name?.toLowerCase().includes(jsSet.name.split(' ')[0].toLowerCase())
      );
      
      if (found) {
        console.log(`✅ ${jsSet.tcgtracking}: ${jsSet.name}`);
        console.log(`   → TCGdex ID: ${found.id}`);
        console.log(`   → Name: ${found.name}`);
        // Check for images
        const imgKeys = Object.keys(found).filter(k => 
          String(found[k as keyof typeof found]).includes('http')
        );
        if (imgKeys.length > 0) {
          imgKeys.forEach(k => {
            console.log(`   → ${k}: ${found[k as keyof typeof found]}`);
          });
        }
      } else {
        console.log(`❌ ${jsSet.tcgtracking}: ${jsSet.name} (no match in TCGdex)`);
      }
    });

    // 3. Opción alternativa: Buscar repos con logo URLs
    console.log('\n\n📍 Buscando fuentes alternativas de logos...\n');
    
    console.log('Alternativas posibles:');
    console.log('1. Official Pokemon TCG Repository (GitHub)');
    console.log('   - https://github.com/KevinLiao159/PokemonTCGJSON');
    console.log('   - Has set symbols and logos\n');
    
    console.log('2. PokemonTCG.io API');
    console.log('   - Has logo and symbol URLs');
    console.log('   - Format: https://images.pokemontcg.io/{setId}/logo.png');
    console.log('   - Need to map Japanese set codes\n');
    
    console.log('3. TCGPlayer CDN directly');
    console.log('   - We already use this for product images');
    console.log('   - Current approach: Extract from booster box images\n');

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

getTCGdexSetImages();
