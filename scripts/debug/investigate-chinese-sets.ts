/**
 * Script: Investigar sets chinos disponibles en TCGdex
 */

import axios from 'axios';

async function investigateChinese() {
  console.log('🔍 Investigando sets chinos en TCGdex\n');

  try {
    // 1. Obtener sets en chino simplificado
    console.log('1️⃣  Descargando sets TCGdex (Chino Simplificado - zh-cn)...\n');
    
    const zhCnRes = await axios.get('https://api.tcgdex.net/v2/zh-cn/sets');
    const zhCnSets = zhCnRes.data;
    
    console.log(`   Total sets: ${zhCnSets.length}\n`);

    if (zhCnSets.length > 0) {
      const sample = zhCnSets[0];
      console.log('📊 Estructura de datos (primer set):\n');
      console.log(JSON.stringify(sample, null, 2));
      
      console.log('\n\n📈 Primeros 15 sets:\n');
      zhCnSets.slice(0, 15).forEach((s: any, i: number) => {
        console.log(`${i + 1}. ${s.name} (${s.id}) - ${s.cardCount?.total || '?'} cartas`);
      });
    }

    // 2. Comparar con Japonés y Inglés
    console.log('\n\n' + '='.repeat(80));
    console.log('2️⃣  Comparación de idiomas disponibles\n');

    const languages = [
      { code: 'en', name: 'English' },
      { code: 'ja', name: 'Japonés' },
      { code: 'zh-cn', name: 'Chino Simplificado' },
      { code: 'zh-tw', name: 'Chino Tradicional' },
      { code: 'es', name: 'Español' },
    ];

    for (const lang of languages) {
      try {
        const res = await axios.get(`https://api.tcgdex.net/v2/${lang.code}/sets`, {
          timeout: 5000
        });
        console.log(`✅ ${lang.name.padEnd(20)} - ${res.data.length} sets disponibles`);
      } catch (error) {
        console.log(`❌ ${lang.name.padEnd(20)} - NO disponible`);
      }
    }

    // 3. Estadística de cartas chinas
    console.log('\n\n' + '='.repeat(80));
    console.log('3️⃣  Análisis de sets chinos\n');

    if (zhCnSets.length > 0) {
      const totalCards = zhCnSets.reduce((sum: number, s: any) => 
        sum + (s.cardCount?.total || 0), 0
      );
      
      console.log(`📦 Total sets: ${zhCnSets.length}`);
      console.log(`🃏 Total cartas (aproximado): ${totalCards}`);
      
      const avgCards = (totalCards / zhCnSets.length).toFixed(0);
      console.log(`📊 Promedio cartas/set: ${avgCards}`);

      // Top 5 sets más grandes
      const top5 = [...zhCnSets]
        .sort((a: any, b: any) => (b.cardCount?.total || 0) - (a.cardCount?.total || 0))
        .slice(0, 5);

      console.log('\n📈 Top 5 sets chinos más grandes:');
      top5.forEach((s: any) => {
        console.log(`   - ${s.name}: ${s.cardCount?.total || '?'} cartas`);
      });
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

investigateChinese();
