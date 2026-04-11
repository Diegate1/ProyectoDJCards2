import axios, { AxiosInstance } from 'axios';
import { TCGTrackingSet, TCGTrackingCard, TCGTrackingResponse } from '../../common/types';

export class TCGTrackingClient {
  private client: AxiosInstance;
  private categoryId: number = 85; // Pokemon Japan

  constructor() {
    this.client = axios.create({
      baseURL: process.env.TCGTRACKING_BASE_URL || 'https://tcgtracking.com/tcgapi/v1',
      timeout: 30000,
    });
  }

  /**
   * Obtener todos los sets japoneses de Pokemon
   * GET /85/sets
   */
  async getAllSets(): Promise<TCGTrackingSet[]> {
    try {
      const response = await this.client.get(`/${this.categoryId}/sets`);
      return response.data.sets || [];
    } catch (error) {
      console.error(`Error fetching TCGTracking sets for category ${this.categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener cartas de un set específico
   * GET /85/sets/{setId}
   * NOTA: La API devuelve 'products' que incluye booster boxes Y cartas individuales
   * Filtramos solo los items que tengan 'number' (esos son las cartas)
   */
  async getCardsBySet(setId: number): Promise<TCGTrackingCard[]> {
    try {
      const response = await this.client.get(`/${this.categoryId}/sets/${setId}`);
      
      // Filtrar solo items con 'number' (esos son cartas, no productos/booster boxes)
      const products = response.data.products || [];
      const cards = products.filter((product: any) => product.number !== null && product.number !== undefined);
      
      return cards;
    } catch (error: any) {
      // Si es 404, el set no tiene cartas disponibles - retornar array vacío
      if (error.response?.status === 404) {
        console.log(`  ℹ️  No cards found for set ${setId} (404) - returning empty array`);
        return [];
      }
      console.error(`Error fetching TCGTracking cards for set ${setId}:`, error.message);
      throw error;
    }
  }

  /**
   * Obtener imagen/logo del set con priorización inteligente
   * Busca la mejor imagen disponible de los productos del set
   * 
   * Prioridad de selección:
   * 1. Official Collection / Official Box
   * 2. Booster Box
   * 3. Elite Trainer Box
   * 4. Premium Collection
   * 5. Cualquier producto con imagen
   */
  async getSetImage(setId: number): Promise<string | null> {
    try {
      const response = await this.client.get(`/${this.categoryId}/sets/${setId}`);
      const products = response.data.products || [];
      
      if (products.length === 0) {
        return null;
      }

      const name = (p: any) => p.name?.toLowerCase() || '';

      // Prioridad 1: Official Collection Box
      let image = products
        .find((p: any) => name(p).includes('official') && name(p).includes('collection'))
        ?.image_url;

      // Prioridad 2: Booster Box (standard release)
      if (!image) {
        image = products
          .find((p: any) => name(p).includes('booster') && name(p).includes('box'))
          ?.image_url;
      }

      // Prioridad 3: Elite Trainer Box
      if (!image) {
        image = products
          .find((p: any) => name(p).includes('elite') || (name(p).includes('trainer') && name(p).includes('box')))
          ?.image_url;
      }

      // Prioridad 4: Premium Collection
      if (!image) {
        image = products
          .find((p: any) => name(p).includes('premium'))
          ?.image_url;
      }

      // Prioridad 5: Any booster/box product
      if (!image) {
        image = products
          .find((p: any) => name(p).includes('booster') || name(p).includes('box'))
          ?.image_url;
      }

      // Prioridad 6: Cualquier producto con imagen (fallback)
      if (!image) {
        image = products.find((p: any) => p.image_url)?.image_url;
      }

      return image || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error(`Error fetching set image for ${setId}:`, error.message);
      return null;
    }
  }
}

export const tcgtrackingClient = new TCGTrackingClient();

/**
 * Raw product data from TCGTracking API
 * (antes de filtrar por number)
 */
export interface TCGTrackingProduct {
  id: number;
  name: string;
  clean_name: string;
  number: string | null; // null para productos (booster boxes), presente para cartas
  rarity: string | null;
  image_url: string;
  image_count: number;
  tcgplayer_url?: string;
}
