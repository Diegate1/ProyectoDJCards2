import axios, { AxiosInstance } from 'axios';

interface TCGdexSet {
  id: string;
  name: string;
  cardCount: {
    total: number;
    official: number;
  };
}

interface TCGdexCard {
  id: string;
  localId: string;
  name: string;
  illustrator?: string;
  rarity?: string;
  category?: string;
  hp?: number;
  types?: string[];
  weaknesses?: Array<{ type: string; value: string }>;
  resistances?: Array<{ type: string; value: string }>;
  attacks?: Array<{
    name: string;
    cost: string[];
    damage: string;
    text?: string;
  }>;
  abilities?: Array<{
    type: string;
    name: string;
    text: string;
  }>;
  image?: {
    small?: string;
    large?: string;
  };
}

class TCGdexChineseClient {
  private client: AxiosInstance;
  private baseURL = 'https://api.tcgdex.net/v2/zh-cn';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'User-Agent': 'ProyectoDJCards2/1.0'
      }
    });
  }

  /**
   * Obtener lista de todos los sets en chino
   */
  async getSets(): Promise<TCGdexSet[]> {
    try {
      const response = await this.client.get('/sets');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching TCGdex Chinese sets:', error);
      throw error;
    }
  }

  /**
   * Obtener cartas de un set específico
   * @param setId ID del set (ej: SV10)
   */
  async getCardsBySet(setId: string): Promise<TCGdexCard[]> {
    try {
      const response = await this.client.get(`/sets/${setId}`);
      return response.data?.cards || [];
    } catch (error) {
      console.error(`Error fetching TCGdex Chinese cards for set ${setId}:`, error);
      return [];
    }
  }

  /**
   * Obtener detalle completo de una carta
   * @param cardId ID de la carta (ej: SV10-001)
   */
  async getCard(cardId: string): Promise<TCGdexCard | null> {
    try {
      const response = await this.client.get(`/cards/${cardId}`);
      return response.data || null;
    } catch (error) {
      console.error(`Error fetching TCGdex Chinese card ${cardId}:`, (error as any).response?.status);
      return null;
    }
  }
}

export const tcgdexChineseClient = new TCGdexChineseClient();
