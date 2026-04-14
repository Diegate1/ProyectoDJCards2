import axios, { AxiosInstance } from 'axios';
import { PaginatedResponse, SetDto, CardDto, CardDetailDto } from '../types';

const API_BASE = '/api';

class DataService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      timeout: 10000,
    });
  }

  /**
   * Obtener listado paginado de sets
   */
  async getSets(
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      releaseDateFrom?: string;
      releaseDateTo?: string;
      cardCountFrom?: number;
      cardCountTo?: number;
    }
  ): Promise<PaginatedResponse<SetDto>> {
    const response = await this.client.get<PaginatedResponse<SetDto>>('/sets', {
      params: { page, pageSize, ...filters },
    });
    return response.data;
  }

  /**
   * Obtener listado paginado de cartas, opcionalmente filtradas por set
   */
  async getCards(
    page: number = 1,
    pageSize: number = 20,
    setId?: string
  ): Promise<PaginatedResponse<CardDto>> {
    const response = await this.client.get<PaginatedResponse<CardDto>>('/cards', {
      params: { page, pageSize, ...(setId && { setId }) },
    });
    return response.data;
  }

  /**
   * Buscar cartas por nombre o número en BD (con filtro opcional por set)
   */
  async searchCards(
    name: string,
    setId?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<CardDto>> {
    const response = await this.client.get<PaginatedResponse<CardDto>>('/cards/search', {
      params: { name, page, pageSize, ...(setId && { setId }) },
    });
    return response.data;
  }

  /**
   * Buscar sets por nombre o código en BD
   */
  async searchSets(
    name: string,
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      releaseDateFrom?: string;
      releaseDateTo?: string;
      cardCountFrom?: number;
      cardCountTo?: number;
    }
  ): Promise<PaginatedResponse<SetDto>> {
    const response = await this.client.get<PaginatedResponse<SetDto>>('/sets/search', {
      params: { name, page, pageSize, ...filters },
    });
    return response.data;
  }

  /**
   * Obtener detalle de una carta
   */
  async getCardDetail(cardId: string): Promise<CardDetailDto> {
    const response = await this.client.get<CardDetailDto>(`/cards/${cardId}`);
    return response.data;
  }

  /**
   * Obtener estadísticas generales
   */
  async getStats(): Promise<any> {
    const response = await this.client.get('/stats');
    return response.data;
  }
}

export const dataService = new DataService();
