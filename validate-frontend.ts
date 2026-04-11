import axios from 'axios';

async function validateFrontendHTML() {
  try {
    const response = await axios.get('http://localhost:5173');
    const html = response.data;
    
    // Count occurrences of language options
    const englishMatch = html.match(/value="English"/g);
    const japaneseMatch = html.match(/value="日本語"/g);
    const chineseMatch = html.match(/value="中文"/g);
    
    // Check for old languages
    const spanishMatch = html.match(/value="Español"/g);
    const frenchMatch = html.match(/value="Français"/g);
    const germanMatch = html.match(/value="Deutsch"/g);
    const italianMatch = html.match(/value="Italiano"/g);
    const portugueseMatch = html.match(/value="Português"/g);
    const koreanMatch = html.match(/value="한국어"/g);
    
    console.log('\n✅ FRONTEND HTML VALIDATION\n');
    console.log('Found language options:');
    console.log(`  - English: ${englishMatch ? englishMatch.length : 0} occurrences`);
    console.log(`  - 日本語: ${japaneseMatch ? japaneseMatch.length : 0} occurrences`);
    console.log(`  - 中文: ${chineseMatch ? chineseMatch.length : 0} occurrences`);
    
    console.log('\nOld languages (should be 0):');
    console.log(`  - Español: ${spanishMatch ? spanishMatch.length : 0}`);
    console.log(`  - Français: ${frenchMatch ? frenchMatch.length : 0}`);
    console.log(`  - Deutsch: ${germanMatch ? germanMatch.length : 0}`);
    console.log(`  - Italiano: ${italianMatch ? italianMatch.length : 0}`);
    console.log(`  - Português: ${portugueseMatch ? portugueseMatch.length : 0}`);
    console.log(`  - 한국어: ${koreanMatch ? koreanMatch.length : 0}`);
    
    if (englishMatch && japaneseMatch && chineseMatch &&
        !spanishMatch && !frenchMatch && !germanMatch && !italianMatch && !portugueseMatch && !koreanMatch) {
      console.log('\n✅ FRONTEND CORRECT: Only 3 languages in HTML!');
      return true;
    } else {
      console.log('\n❌ FRONTEND ERROR: Languages mismatch');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error fetching frontend:', error instanceof axios.AxiosError ? error.message : error);
    return false;
  }
}

validateFrontendHTML().then(success => {
  process.exit(success ? 0 : 1);
});
