import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function debugTCGTrackingAPI() {
  const categoryId = 85;
  const baseURL = 'https://tcgtracking.com/tcgapi/v1';
  
  try {
    console.log('='.repeat(80));
    console.log('DEBUGGING TCGTracking API Response Structure');
    console.log('='.repeat(80));

    // 1. Obtener lista de sets
    console.log('\n1️⃣  Fetching sets list...');
    const setsResponse = await axios.get(`${baseURL}/${categoryId}/sets`);
    console.log(`\n✓ Sets response keys:`, Object.keys(setsResponse.data));
    console.log(`✓ Array "sets" length:`, setsResponse.data.sets?.length || 0);
    console.log(`✓ First set:`, JSON.stringify(setsResponse.data.sets?.[0], null, 2));

    // 2. Obtener cartas de un set específico
    if (setsResponse.data.sets && setsResponse.data.sets.length > 0) {
      const setExample = setsResponse.data.sets[0];
      const setId = setExample.id;
      
      console.log(`\n2️⃣  Fetching cards for set ${setId} (${setExample.name})...`);
      const cardsResponse = await axios.get(`${baseURL}/${categoryId}/sets/${setId}`);
      console.log(`\n✓ Cards response keys:`, Object.keys(cardsResponse.data));
      console.log(`\n✓ Full response structure:`, JSON.stringify(cardsResponse.data, null, 2).slice(0, 2000));

      // 4. Intentar otro set para comparar
      const set2 = setsResponse.data.sets[10];
      if (set2) {
        console.log(`\n4️⃣  Fetching cards for second set ${set2.id} (${set2.name})...`);
        const cards2Response = await axios.get(`${baseURL}/${categoryId}/sets/${set2.id}`);
        console.log(`✓ Second set cards count:`, cards2Response.data.cards?.length || 0);
        if (cards2Response.data.cards && cards2Response.data.cards.length > 0) {
          console.log(`✓ Second set first card:`, JSON.stringify(cards2Response.data.cards[0], null, 2));
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Debug complete. Analyze the output above to fix the parsing.');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('❌ Error during debugging:', error);
    process.exit(1);
  }
}

debugTCGTrackingAPI();
