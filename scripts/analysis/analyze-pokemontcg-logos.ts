/**
 * Script: Obtener logos desde PokemonTCG.io con fallback a TCGPlayer
 * 
 * Estrategia:
 * 1. Buscar el set por nombre en PokemonTCG.io
 * 2. Si existe, usar logo de allí
 * 3. Si no, mantener TCGPlayer como fallback
 */

import axios from 'axios';

async function getLogoStrategy() {
  console.log('🎯 Estrategia de logos: PokemonTCG.io + Fallback TCGPlayer\n');

  try {
    // 1. Obtener todos los sets de PokemonTCG.io
    console.log('1️⃣  Descargando sets de PokemonTCG.io...\n');
    
    const response = await axios.get('https://api.pokemontcg.io/v2/sets');
    const allSets = response.data.data;
    
    console.log(`   Total sets found: ${allSets.length}\n`);

    // 2. Buscar equivalencias para sets japoneses
    const jpSets = [
      { tcgtracking: 'M4', name: 'Ninja Spinner' },
      { tcgtracking: 'M3', name: 'Nihil Zero' },
      { tcgtracking: 'MP1', name: 'Start Deck 100' },
      { tcgtracking: 'MV', name: 'Future Flash' },
      { tcgtracking: 'BW1', name: 'Black & White' },
    ];

    console.log('📍 Buscando equivalencias en PokemonTCG.io:\n');

    jpSets.forEach(jp => {
      // Buscar por nombre o serie
      const matches = allSets.filter((s: any) => 
        s.name?.toLowerCase().includes(jp.name.toLowerCase()) ||
        s.series?.toLowerCase().includes(jp.name.split(' ')[0].toLowerCase())
      );

      console.log(`${jp.tcgtracking}: ${jp.name}`);
      
      if (matches.length > 0) {
        matches.slice(0, 3).forEach((m: any) => {
          console.log(`   ✅ Found: ${m.name} (${m.id})`);
          console.log(`      Logo: ${m.images?.logo || 'NO'}`);
          console.log(`      Symbol: ${m.images?.symbol || 'NO'}`);
        });
      } else {
        console.log(`   ❌ No matches found\n`);
      }
    });

    // 3. Estadística: cuántos sets tienen logos
    console.log('\n\n📊 Estadísticas de logos en PokemonTCG.io:\n');
    
    const withLogo = allSets.filter((s: any) => s.images?.logo).length;
    const withSymbol = allSets.filter((s: any) => s.images?.symbol).length;
    
    console.log(`   Total sets: ${allSets.length}`);
    console.log(`   With logo: ${withLogo} (${((withLogo/allSets.length)*100).toFixed(1)}%)`);
    console.log(`   With symbol: ${withSymbol} (${((withSymbol/allSets.length)*100).toFixed(1)}%)`);

    // 4. Mostrar ejemplos de URLs
    console.log('\n\n🔗 Ejemplos de URLs de logos:\n');
    
    const exampleLogoSets = allSets.filter((s: any) => s.images?.logo).slice(0, 5);
    exampleLogoSets.forEach((s: any) => {
      console.log(`${s.name}:`);
      console.log(`  Logo: ${s.images.logo}`);
      console.log(`  Symbol: ${s.images.symbol}\n`);
    });

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

getLogoStrategy();
