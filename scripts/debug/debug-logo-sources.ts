/**
 * Debug script: Analizar fuentes disponibles de logos para sets
 * Investiga: TCGdex, PokemonTCG.io, TCGTracking
 */

import axios from 'axios';

async function DEBUG() {
  console.log('🔍 Investigando fuentes de logos para sets...\n');

  try {
    // ============================================
    // 1. TCGdex - Sets en Japonés
    // ============================================
    console.log('📍 1. TCGdex (Japonés)\n');
    
    const tcgdexRes = await axios.get('https://api.tcgdex.net/v2/ja/sets');
    const tcgdexSets = tcgdexRes.data;
    
    if (tcgdexSets.length > 0) {
      const firstJaSet = tcgdexSets.find((s: any) => 
        s.name?.toLowerCase().includes('ninja') || s.id === 'm4a'
      ) || tcgdexSets[0];
      
      console.log('Sample Response:');
      console.log(JSON.stringify(firstJaSet, null, 2));
      console.log('\nFields con potencial logo:');
      console.log('  - logo:', firstJaSet.logo || 'NO');
      console.log('  - symbol:', firstJaSet.symbol || 'NO');
      console.log('  - image:', firstJaSet.image || 'NO');
      console.log('  - illustrator:', firstJaSet.illustrator || 'NO');
      
      // Verificar todas las propiedades con URL
      const urlProps = Object.entries(firstJaSet)
        .filter(([k, v]) => typeof v === 'string' && (v as string).includes('http'))
        .map(([k, v]) => `  - ${k}: ${(v as string).substring(0, 80)}...`);
      
      if (urlProps.length > 0) {
        console.log('\nPropiedades con URLs:');
        urlProps.forEach(p => console.log(p));
      }
    }

    // ============================================
    // 2. PokemonTCG.io - Buscar set japonés
    // ============================================
    console.log('\n\n📍 2. PokemonTCG.io\n');
    
    // Buscar sets con "Japanese" en nombre o similar
    const pokRes = await axios.get('https://api.pokemontcg.io/v2/sets');
    const pokesets = pokRes.data.data;
    
    // Buscar un set japonés conocido
    const japaneseSet = pokesets.find((s: any) => 
      s.name?.includes('Shining') || s.name?.includes('Japanese') || s.series?.toLowerCase().includes('sword')
    );
    
    if (japaneseSet) {
      console.log('Sample Response (Japanese/Sword/Shield set):');
      console.log(JSON.stringify(japaneseSet, null, 2));
    } else {
      console.log('Sample Response (First set):');
      console.log(JSON.stringify(pokesets[0], null, 2));
    }
    
    console.log('\nBuscando propiedades de imagen en sets:');
    
    const imageProps = {};
    pokesets.slice(0, 10).forEach((set: any) => {
      Object.keys(set).forEach(key => {
        if ((key.includes('image') || key.includes('logo') || key.includes('url') || key.includes('symbol')) && set[key]) {
          (imageProps as any)[key] = set[key];
        }
      });
    });
    
    console.log(JSON.stringify(imageProps, null, 2));

    // ============================================
    // 3. TCGTracking - Verificar sets endpoint
    // ============================================
    console.log('\n\n📍 3. TCGTracking (Category 85)\n');
    
    const tcgtrRes = await axios.get('https://tcgtracking.com/tcgapi/v1/85/sets?limit=1');
    const tcgtrSets = tcgtrRes.data.sets;
    
    if (tcgtrSets.length > 0) {
      console.log('Sample Response:');
      console.log(JSON.stringify(tcgtrSets[0], null, 2));
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

DEBUG();
