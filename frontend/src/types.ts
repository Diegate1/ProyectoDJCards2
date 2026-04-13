/**
 * tipos.ts - Tipos compartidos con backend
 * DTOs y interfaces para comunicación API
 */

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface SetDto {
  id: string;
  name: string;
  releaseDate: string | null;
  cardCount: number;
  languages: string[];
  imageUrl: string;
}

export interface CurrentPriceDto {
  amount: number | null;
  currency: string;
  label: string;
}

export interface CardDto {
  id: string;
  name: string;
  number: string;
  imageUrl: string;
  rarity?: string;
  currentPrice: CurrentPriceDto;
  set: {
    id: string;
    name: string;
  };
}

export interface CardAttackDto {
  name: string;
  damage: string | null;
  text: string | null;
  cost: string[];
}

export interface CardAbilityDto {
  name: string;
  type: string;
  text: string;
}

export interface CardWeaknessDto {
  type: string;
  value: string;
}

export interface CardDetailDto {
  id: string;
  name: string;
  number: string;
  rarity: string | null;
  supertype: string;
  hp: string | null;
  artist: string | null;
  imageUrl: string;
  flavorText: string | null;
  set: {
    id: string;
    name: string;
  };
  currentPrice: CurrentPriceDto;
  attacks: CardAttackDto[];
  abilities: CardAbilityDto[];
  weaknesses: CardWeaknessDto[];
  resistances: CardWeaknessDto[];
}
