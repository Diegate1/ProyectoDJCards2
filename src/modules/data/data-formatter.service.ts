/**
 * Servicio de utilidades para formatear datos de BD a DTOs para frontend
 */

import { CurrentPriceDto } from '../../common/types';

export class DataFormatterService {
  /**
   * Extrae idiomas del metadata JSONB de un set
   * Busca array de idiomas o fallback vacío
   */
  static extractLanguages(metadata: any): string[] {
    if (!metadata) return [];
    
    try {
      // Si es string, parsearlo
      const data = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      
      // Buscar campo de idiomas
      if (Array.isArray(data.languages)) {
        return data.languages;
      }
      if (Array.isArray(data.supportedLanguages)) {
        return data.supportedLanguages;
      }
      
      return [];
    } catch (error) {
      console.warn('Error parsing metadata for languages:', error);
      return [];
    }
  }

  /**
   * Resuelve URL de imagen con fallback
   * Prioridad: primary → fallback1 → fallback2 → placeholder
   */
  static resolveImageUrl(
    primary: string | null | undefined,
    fallback1: string | null | undefined,
    fallback2: string | null | undefined,
    placeholder: string = '/images/placeholder-card.png'
  ): string {
    if (primary) return primary;
    if (fallback1) return fallback1;
    if (fallback2) return fallback2;
    return placeholder;
  }

  /**
   * Obtiene el precio actual de un producto
   * Prioridad: market_price → mid_price → low_price
   * @param marketPrice precio de mercado
   * @param midPrice precio medio
   * @param lowPrice precio bajo
   * @returns CurrentPriceDto con amount, currency, y label
   */
  static formatCurrentPrice(
    marketPrice: number | null | undefined,
    midPrice: number | null | undefined,
    lowPrice: number | null | undefined,
    currency: string = 'USD'
  ): CurrentPriceDto {
    if (marketPrice !== null && marketPrice !== undefined) {
      return {
        amount: marketPrice,
        currency,
        label: 'Market',
      };
    }
    
    if (midPrice !== null && midPrice !== undefined) {
      return {
        amount: midPrice,
        currency,
        label: 'Mid',
      };
    }
    
    if (lowPrice !== null && lowPrice !== undefined) {
      return {
        amount: lowPrice,
        currency,
        label: 'Low',
      };
    }
    
    return {
      amount: null,
      currency,
      label: 'N/A',
    };
  }

  /**
   * Formatea un precio numérico a string legible
   * Ej: 12.50 USD → "$12.50"
   */
  static formatPriceString(amount: number | null, currency: string = 'USD'): string {
    if (amount === null || amount === undefined) {
      return 'Sin precio';
    }
    
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    
    return formatted;
  }

  /**
   * Extrae lista de tipos/tipos-energía del metadata
   */
  static extractTypes(metadata: any): string[] {
    if (!metadata) return [];
    
    try {
      const data = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      
      if (Array.isArray(data.types)) {
        return data.types;
      }
      
      return [];
    } catch (error) {
      console.warn('Error parsing metadata for types:', error);
      return [];
    }
  }

  /**
   * Extrae debilidades
   */
  static extractWeaknesses(metadata: any): Array<{ type: string; value: string }> {
    if (!metadata) return [];
    
    try {
      const data = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      
      if (Array.isArray(data.weaknesses)) {
        return data.weaknesses;
      }
      
      return [];
    } catch (error) {
      console.warn('Error parsing metadata for weaknesses:', error);
      return [];
    }
  }

  /**
   * Extrae resistencias
   */
  static extractResistances(metadata: any): Array<{ type: string; value: string }> {
    if (!metadata) return [];
    
    try {
      const data = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      
      if (Array.isArray(data.resistances)) {
        return data.resistances;
      }
      
      return [];
    } catch (error) {
      console.warn('Error parsing metadata for resistances:', error);
      return [];
    }
  }
}
