import axios, { AxiosInstance } from 'axios';
import { TCGplayerGroup, TCGplayerProduct, TCGplayerPrice } from '../../common/types';

export class TCGCSVClient {
  private client: AxiosInstance;
  private pokemonCategoryId: number;

  constructor() {
    this.pokemonCategoryId = parseInt(process.env.POKEMON_CATEGORY_ID || '3', 10);
    
    this.client = axios.create({
      baseURL: process.env.TCGCSV_BASE_URL || 'https://tcgcsv.com/tcgplayer',
      timeout: 30000,
    });
  }

  async getCategories(): Promise<any[]> {
    try {
      const response = await this.client.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  async getGroups(categoryId: number = this.pokemonCategoryId): Promise<TCGplayerGroup[]> {
    try {
      const response = await this.client.get(`/${categoryId}/groups`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching groups for category ${categoryId}:`, error);
      throw error;
    }
  }

  async getProducts(
    categoryId: number = this.pokemonCategoryId,
    groupId: number,
    offset: number = 0,
    limit: number = 5000
  ): Promise<TCGplayerProduct[]> {
    try {
      const response = await this.client.get(`/${categoryId}/${groupId}/products`, {
        params: { offset, limit },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching products for group ${groupId}:`, error);
      throw error;
    }
  }

  async getPrices(
    categoryId: number = this.pokemonCategoryId,
    groupId: number,
    offset: number = 0,
    limit: number = 10000
  ): Promise<TCGplayerPrice[]> {
    try {
      const response = await this.client.get(`/${categoryId}/${groupId}/prices`, {
        params: { offset, limit },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching prices for group ${groupId}:`, error);
      throw error;
    }
  }

  async getProductsAndPrices(
    categoryId: number = this.pokemonCategoryId,
    groupId: number
  ): Promise<{
    products: TCGplayerProduct[];
    prices: TCGplayerPrice[];
  }> {
    try {
      const [products, prices] = await Promise.all([
        this.getProducts(categoryId, groupId),
        this.getPrices(categoryId, groupId),
      ]);

      return { products, prices };
    } catch (error) {
      console.error(`Error fetching products and prices for group ${groupId}:`, error);
      throw error;
    }
  }
}

export const tcgcsvClient = new TCGCSVClient();
