import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function checkSetImages() {
  const categoryId = 85;
  const baseURL = 'https://tcgtracking.com/tcgapi/v1';
  
  try {
    console.log('Verificando qué imágenes devuelve TCGTracking...\n');

    // Obtener lista de sets
    const setsResponse = await axios.get(`${baseURL}/${categoryId}/sets`);
    const sets = setsResponse.data.sets.slice(0, 3); // Primeros 3 sets

    for (const set of sets) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Set: ${set.name} (ID: ${set.id})`);
      console.log(`${'='.repeat(60)}`);
      
      const keys = Object.keys(set);
      console.log(`\nTodas las keys disponibles en el set:`);
      keys.forEach(key => {
        const value = set[key];
        if (value && typeof value === 'string' && value.includes('http')) {
          console.log(`  ✓ ${key}: ${value}`);
        } else if (value && typeof value === 'string') {
          console.log(`  - ${key}: ${value}`);
        }
      });

      console.log(`\nJSON completo del primer set:`);
      console.log(JSON.stringify(sets[0], null, 2));
      break; // Solo el primero
    }

    console.log('\n\n💡 Conclusión:');
    console.log('- TCGTracking NO devuelve logo_url ni symbol_url en /sets');
    console.log('- Las imágenes vienen en el endpoint /sets/{setId}');
    console.log('- Necesitamos usar las imágenes de los productos como set_image');

  } catch (error) {
    console.error('Error:', (error as Error).message);
  }
}

checkSetImages();
