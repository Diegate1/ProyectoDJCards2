/**
 * Utilidades comunes para el proyecto
 */

/**
 * Normalizar nombre de set para comparación
 */
export function normalizeSetName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[&]/g, 'and')
    .replace(/[^\w\s]/g, '');
}

/**
 * Extraer código de set del número de carta (e.g., "sv1-1" → "sv1")
 */
export function extractSetCodeFromCard(cardNumber: string): string | null {
  const match = cardNumber.match(/^([a-z0-9]+)-\d+/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Clasificar producto por nombre y extended data
 */
export function classifyProductType(
  name: string,
  extendedData?: Array<{ name: string; value: string }>
): 'single_card' | 'sealed_product' | 'unknown' {
  // Primero revisar extendedData
  if (extendedData && extendedData.length > 0) {
    const dataNames = extendedData.map(d => d.name?.toLowerCase() || '');

    if (dataNames.includes('number') || dataNames.includes('rarity')) {
      return 'single_card';
    }

    if (
      dataNames.some(n =>
        n.includes('booster') ||
        n.includes('elite') ||
        n.includes('tin') ||
        n.includes('collection')
      )
    ) {
      return 'sealed_product';
    }
  }

  // Revisar por palabras clave en nombre
  const nameLower = name.toLowerCase();
  const sealedKeywords = [
    'booster box',
    'elite trainer',
    'tin',
    'blister',
    'sleeved booster',
    'collection',
    'premium collection',
    'build & battle',
    'deck box',
    'theme deck',
  ];

  if (sealedKeywords.some(keyword => nameLower.includes(keyword))) {
    return 'sealed_product';
  }

  return 'unknown';
}

/**
 * Convertir precio a número decimal
 */
export function parsePrice(price: any): number | null {
  if (price === null || price === undefined) {
    return null;
  }

  if (typeof price === 'number') {
    return price;
  }

  if (typeof price === 'string') {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}

/**
 * Esperar X milisegundos (para rate limiting)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry logic con exponential backoff
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delayMs = baseDelayMs * Math.pow(2, i);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delayMs}ms`, error);
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Paginar un array
 */
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/**
 * Validar que los campos requeridos estén presentes
 */
export function validateRequired(obj: any, fields: string[]): string[] {
  const errors: string[] = [];

  for (const field of fields) {
    if (!obj[field]) {
      errors.push(`Field "${field}" is required`);
    }
  }

  return errors;
}
