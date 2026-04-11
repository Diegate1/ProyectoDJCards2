import axios, { AxiosInstance } from 'axios';
import { TCGdexSet, TCGdexCard } from '../../common/types';

export class TCGdexClient {
  private client: AxiosInstance;
  private defaultLang: string;

  constructor(lang: string = 'en') {
    this.defaultLang = lang || process.env.TCGDEX_DEFAULT_LANG || 'en';
    
    this.client = axios.create({
      baseURL: process.env.TCGDEX_BASE_URL || 'https://api.tcgdex.net/v2',
      timeout: 30000,
    });
  }

  setLanguage(lang: string): void {
    this.defaultLang = lang;
  }

  async getAllSets(lang: string = this.defaultLang): Promise<TCGdexSet[]> {
    try {
      const response = await this.client.get(`/${lang}/sets`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching sets for language ${lang}:`, error);
      throw error;
    }
  }

  async getSet(setId: string, lang: string = this.defaultLang): Promise<TCGdexSet> {
    try {
      const response = await this.client.get(`/${lang}/sets/${setId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching set ${setId} for language ${lang}:`, error);
      throw error;
    }
  }

  async getAllCards(lang: string = this.defaultLang): Promise<TCGdexCard[]> {
    try {
      const response = await this.client.get(`/${lang}/cards`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching cards for language ${lang}:`, error);
      throw error;
    }
  }

  async getCard(cardId: string, lang: string = this.defaultLang): Promise<TCGdexCard> {
    try {
      const response = await this.client.get(`/${lang}/cards/${cardId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching card ${cardId} for language ${lang}:`, error);
      throw error;
    }
  }

  async getCardBySetAndNumber(setId: string, cardNumber: string, lang: string = this.defaultLang): Promise<TCGdexCard> {
    try {
      const response = await this.client.get(`/${lang}/sets/${setId}/${cardNumber}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching card ${setId}/${cardNumber} for language ${lang}:`, error);
      throw error;
    }
  }

  async getSetCards(setId: string, lang: string = this.defaultLang): Promise<TCGdexCard[]> {
    try {
      const response = await this.client.get(`/${lang}/sets/${setId}/cards`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching cards for set ${setId} and language ${lang}:`, error);
      throw error;
    }
  }
}

export const tcgdexClient = new TCGdexClient();
