import axios from 'axios';

/**
 * Script para scrapear sets japoneses de PokeGuardian
 * DESACTIVADO: cheerio no está en las dependencias
 */

interface JapaneseSetData {
  name: string;
  code: string;
  series: string;
  releaseDate?: string;
  totalCards?: number;
  cardImage?: string;
}

async function scrapePokeguardianJapaneseSets(): Promise<JapaneseSetData[]> {
  throw new Error('Este scraper no está disponible - cheerio no instalado');
}

export { scrapePokeguardianJapaneseSets };
