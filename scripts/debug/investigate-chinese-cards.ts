/**
 * Script: Investigar estructura de cartas chinas en TCGdex
 */

import axios from 'axios';

async function investigateChineseCards() {
  console.log('🔍 Investigando disponibilidad de cartas chinas en TCGdex\n');

  try {
    // 1. Intentar acceder a cartas de un set chino conocido
    console.log('1️⃣  Probando endpoint de cartas chino...\n');

    const setIds = ['CSM1bC', 'csm1a', 'csm1.5'];

    for (const setId of setIds) {
      try {
        console.log(`   Intentando: /zh-cn/sets/${setId}/cards`);
        const res = await axios.get(
          `https://api.tcgdex.net/v2/zh-cn/sets/${setId}/cards`,
          { timeout: 5000 }
        );
        console.log(`   ✅ Success! Found ${res.data.length} cards\n`);
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log(`   ❌ 404 Not found\n`);
        } else {
          console.log(`   ❌ Error: ${error.message}\n`);
        }
      }
    }

    // 2. Intentar endpoint /cards directamente
    console.log('\n2️⃣  Probando endpoint global de cartas...\n');
    
    try {
      console.log('   Intentando: /zh-cn/cards');
      const res = await axios.get('https://api.tcgdex.net/v2/zh-cn/cards', {
        timeout: 5000,
      });
      console.log(`   ✅ Success! Found ${res.data.length} total cards`);
      
      // Mostrar estructura de primera carta
      if (res.data.length > 0) {
        console.log('\n   Primera carta (estructura):');
        console.log(JSON.stringify(res.data[0], null, 2).substring(0, 300));
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('   ❌ 404 Not found - Endpoint no existe\n');
      } else {
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }

    // 3. Verificar si es un idioma totalmente soportado
    console.log('\n3️⃣  Comparación de idiomas y disponibilidad\n');

    const languages = ['en', 'ja', 'zh-cn', 'es', 'fr'];
    
    for (const lang of languages) {
      try {
        const sets = await axios.get(`https://api.tcgdex.net/v2/${lang}/sets`);
        const cards = await axios.get(`https://api.tcgdex.net/v2/${lang}/cards`);
        
        console.log(`✅ ${lang.padEnd(8)} - Sets: ${sets.data.length}, Cards: ${cards.data.length}`);
      } catch (error) {
        console.log(`❌ ${lang.padEnd(8)} - No disponible`);
      }
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

investigateChineseCards();
