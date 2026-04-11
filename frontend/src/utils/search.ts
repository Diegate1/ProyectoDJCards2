/**
 * Algoritmo de búsqueda fuzzy - permite matching flexible
 * Ejemplo: "prfct ordr" coincide con "Perfect Order"
 */
export function fuzzyMatch(searchTerm: string, target: string): number {
  const search = searchTerm.toLowerCase().trim();
  const text = target.toLowerCase();

  if (!search) return 1; // Sin búsqueda, coincide todo
  if (text === search) return 100; // Coincidencia exacta
  if (text.includes(search)) return 90; // Coincidencia de substring

  // Algoritmo Levenshtein simplificado para typos
  let score = 0;
  let searchIdx = 0;

  for (let i = 0; i < text.length && searchIdx < search.length; i++) {
    if (text[i] === search[searchIdx]) {
      score += 10;
      searchIdx++;
    }
  }

  // Si encontramos todos los caracteres, es válido
  if (searchIdx === search.length) {
    return Math.max(5, score);
  }

  // También intenta por caracteres iniciales de palabras
  const words = text.split(/\s+/);
  const searchWords = search.split(/\s+/);

  for (const searchWord of searchWords) {
    for (const word of words) {
      if (word.startsWith(searchWord)) {
        return 80; // Alta coincidencia para inicio de palabra
      }
    }
  }

  return 0; // No coincide
}

/**
 * Busca en múltiples campos con relevancia ponderada
 */
export function searchInFields(
  items: any[],
  searchTerm: string,
  fields: Array<{ name: string; weight: number }>
): Array<{ item: any; score: number }> {
  if (!searchTerm.trim()) {
    return items.map((item) => ({ item, score: 0 }));
  }

  return items
    .map((item) => {
      let totalScore = 0;

      for (const field of fields) {
        const value = item[field.name];
        if (value) {
          const fieldScore = fuzzyMatch(searchTerm, String(value));
          totalScore += fieldScore * field.weight;
        }
      }

      return { item, score: totalScore };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Formatea búsqueda para compatibilidad con endpoints
 */
export function formatSearchQuery(term: string): string {
  return term.toLowerCase().trim();
}
