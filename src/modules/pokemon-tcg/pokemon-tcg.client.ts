import axios, { AxiosInstance } from 'axios';
import { PokemonTCGSet, PokemonTCGCard, PokemonTCGResponse } from '../../common/types';

export class PokemonTCGClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.POKEMON_TCG_API_KEY || '';
    
    this.client = axios.create({
      baseURL: process.env.POKEMON_TCG_BASE_URL || 'https://api.pokemontcg.io/v2',
      timeout: 30000,
    });

    if (this.apiKey) {
      this.client.defaults.headers.common['X-Api-Key'] = this.apiKey;
    }
  }

  async getAllSets(page: number = 1, pageSize: number = 250): Promise<PokemonTCGResponse<PokemonTCGSet>> {
    try {
      const response = await this.client.get('/sets', {
        params: { page, pageSize },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching sets:', error);
      throw error;
    }
  }

  async getSet(setId: string): Promise<{ data: PokemonTCGSet }> {
    try {
      const response = await this.client.get(`/sets/${setId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching set ${setId}:`, error);
      throw error;
    }
  }

  async getCardsBySet(
    setId: string,
    page: number = 1,
    pageSize: number = 250
  ): Promise<PokemonTCGResponse<PokemonTCGCard>> {
    try {
      const query = `set.id:${setId}`;
      const response = await this.client.get('/cards', {
        params: {
          q: query,
          page,
          pageSize,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching cards for set ${setId}:`, error);
      throw error;
    }
  }

  async getCard(cardId: string): Promise<{ data: PokemonTCGCard }> {
    try {
      const response = await this.client.get(`/cards/${cardId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching card ${cardId}:`, error);
      throw error;
    }
  }

  async searchCards(query: string, page: number = 1, pageSize: number = 250): Promise<PokemonTCGResponse<PokemonTCGCard>> {
    try {
      const response = await this.client.get('/cards', {
        params: { q: query, page, pageSize },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching cards:', error);
      throw error;
    }
  }

  async getTypes(): Promise<any> {
    try {
      const response = await this.client.get('/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching types:', error);
      throw error;
    }
  }

  async getSubtypes(): Promise<any> {
    try {
      const response = await this.client.get('/subtypes');
      return response.data;
    } catch (error) {
      console.error('Error fetching subtypes:', error);
      throw error;
    }
  }

  async getRarities(): Promise<any> {
    try {
      const response = await this.client.get('/rarities');
      return response.data;
    } catch (error) {
      console.error('Error fetching rarities:', error);
      throw error;
    }
  }
}

export const pokemonTcgClient = new PokemonTCGClient();
