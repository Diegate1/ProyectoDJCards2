import axios from 'axios';

async function testAPIResponse() {
  try {
    const response = await axios.get('http://localhost:3000/api/sets?page=1&pageSize=20');
    
    console.log('\n📊 API RESPONSE TEST\n');
    console.log('Total items:', response.data.pagination.totalItems);
    console.log('\nFirst 10 sets with languages:\n');
    
    response.data.items.forEach((set: any, idx: number) => {
      console.log(`${idx + 1}. ${set.name}`);
      console.log(`   Languages: ${set.languages.join(', ')}`);
    });
    
    // Obtener todos los idiomas únicos
    const allLanguages = new Set<string>();
    response.data.items.forEach((set: any) => {
      (set.languages || []).forEach((lang: string) => {
        allLanguages.add(lang);
      });
    });
    
    console.log('\n🌐 Unique languages in API response:');
    Array.from(allLanguages).forEach(lang => {
      console.log(`  - ${lang}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error instanceof axios.AxiosError ? error.message : error);
  }
  
  process.exit(0);
}

testAPIResponse();
