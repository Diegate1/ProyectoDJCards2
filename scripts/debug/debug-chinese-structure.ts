/**
 * Debug: Entender estructura de cartas chinas en TCGdex
 */

import axios from 'axios';

async function debugChineseStructure() {
  console.log('🔍 Analizando estructura de cartas chinas\n');

  try {
    // Obtener cartas chinas
    const cardsRes = await axios.get('https://api.tcgdex.net/v2/zh-cn/cards');
    const cards = cardsRes.data;

    console.log(`Total cards in zh-cn: ${cards.length}\n`);

    // Agrupar por set ID
    const cardsBySetId: { [key: string]: any[] } = {};
    
    cards.forEach((card: any) => {
      const setId = card.id?.split('-')[0]?.toLowerCase() || 'unknown';
      if (!cardsBySetId[setId]) {
        cardsBySetId[setId] = [];
      }
      cardsBySetId[setId].push(card);
    });

    console.log('Sets encontrados en cartas chinas:');
    Object.entries(cardsBySetId).forEach(([setId, cardList]) => {
      console.log(`  ${setId}: ${cardList.length} cards`);
    });

    console.log('\n\nSets chinos disponibles en TCGdex:');
    const setsRes = await axios.get('https://api.tcgdex.net/v2/zh-cn/sets');
    const sets = setsRes.data;
    
    sets.forEach((s: any) => {
      console.log(`  ${s.id}: ${s.name} (${s.cardCount?.total} cards)`);
    });

    console.log('\n\nComparación:');
    console.log('✅ Sets chinos con cartas directas:');
    Object.keys(cardsBySetId).forEach((setId) => {
      if (sets.some((s: any) => s.id === setId)) {
        console.log(`  ${setId}: ${cardsBySetId[setId].length} cards`);
      }
    });

    console.log('\n❌ Sets chinos SIN cartas disponibles:');
    sets.forEach((s: any) => {
      if (!cardsBySetId[s.id]) {
        console.log(`  ${s.id}: ${s.name} (no cards)`);
      }
    });

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

debugChineseStructure();
