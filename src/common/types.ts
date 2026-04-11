// Interfaces para respuestas de las tres APIs

export interface PokemonTCGSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  legalities?: Record<string, string>;
  ptcgoCode?: string;
  releaseDate: string;
  updatedAt: string;
  images: {
    symbol: string;
    logo: string;
  };
}

export interface PokemonTCGCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  evolvesFrom?: string;
  abilities?: Array<{
    name: string;
    type: string;
    text: string;
  }>;
  attacks?: Array<{
    name: string;
    cost: string[];
    convertedEnergyCost: number;
    damage?: string;
    text?: string;
  }>;
  weaknesses?: Array<{
    type: string;
    value: string;
  }>;
  resistances?: Array<{
    type: string;
    value: string;
  }>;
  retreatCost?: string[];
  convertedRetreatCost?: number;
  set: {
    id: string;
    name: string;
  };
  number: string;
  artist?: string;
  rarity?: string;
  flavorText?: string;
  nationalPokedexNumbers?: number[];
  legalities?: Record<string, string>;
  images?: {
    small: string;
    large: string;
  };
  tcgplayer?: any;
  cardmarket?: any;
}

export interface PokemonTCGResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

export interface TCGdexSet {
  id: string;
  name: string;
  logo?: string;
  symbol?: string;
  cardCount?: {
    total?: number;
    official?: number;
    reverse?: number;
    holo?: number;
    firstEd?: number;
  };
  serie?: string;
  serieId?: string;
  tcgOnline?: string;
  printedTotal?: number;
  total?: number;
  cards?: TCGdexCard[]; // Cartas anidadas (cuando se obtiene un set completo)
}

export interface TCGdexCard {
  id: string;
  name: string;
  number?: string;
  localId?: string; // Número local de la carta en el set
  image?: string | { small?: string; large?: string };
  stage?: string;
  types?: string[];
  hp?: number;
  abilities?: Array<{
    name: string;
    type: string;
    text: string;
  }>;
  attacks?: Array<{
    name: string;
    cost: string[];
    damage?: string;
    text?: string;
  }>;
  retreatCost?: string[];
  rarity?: string;
  illustrator?: string;
  supertype?: string;
  rules?: string[];
  evolvesFrom?: string;
  set?: string;
  variants?: any;
}

export interface TCGplayer {
  categoryId: number;
  groupId?: number;
  productId?: number;
  name: string;
  cleanName?: string;
  imageUrl?: string;
  url?: string;
}

export interface TCGplayerProduct {
  productId: number;
  name: string;
  cleanName: string;
  imageUrl: string;
  categoryId: number;
  groupId: number;
  url: string;
  modifiedOn: string;
  imageCount: number;
  presaleInfo?: any;
  extendedData?: Array<{
    name: string;
    value: string;
  }>;
}

export interface TCGplayerPrice {
  productId: number;
  lowPrice?: number;
  midPrice?: number;
  highPrice?: number;
  marketPrice?: number;
  directLowPrice?: number;
  subTypeName: string;
}

export interface TCGplayerGroup {
  groupId: number;
  name: string;
  abbreviation: string;
  isSupplemental: boolean;
  publishedOn: string;
  modifiedOn: string;
  categoryId: number;
}

// ===== TCGTracking API Types =====

export interface TCGTrackingSet {
  id: number;
  name: string;
  abbreviation: string;
  published_on: string;
  product_count: number;
  sku_count: number;
  api_url: string;
  pricing_url: string;
}

export interface TCGTrackingCard {
  id: number;
  name: string;
  clean_name?: string;
  number: string; // "001/083" - null solo para productos
  rarity: string | null;
  image_url: string; // URL de la imagen
  image_count?: number;
  tcgplayer_url?: string;
  manapool_url?: string | null;
  scryfall_id?: string | null;
  mtgjson_uuid?: string | null;
  cardmarket_id?: number | null;
  cardtrader_id?: number | null;
}

export interface TCGTrackingResponse {
  category_id: number;
  category_name: string;
  sets?: TCGTrackingSet[];
  cards?: TCGTrackingCard[];
}

export interface ApiLogEntry {
  provider: string;
  method: string;
  url: string;
  statusCode?: number;
  requestHeaders?: Record<string, string>;
  requestParams?: Record<string, any>;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  errorText?: string;
  durationMs?: number;
}

// ===== DTOs para Frontend - Dashboard y Catálogo =====

/**
 * Respuesta paginada genérica
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

/**
 * DTO: Set para dashboard principal
 * Simplificado y limpio para la tabla de sets
 */
export interface SetDto {
  id: string;
  name: string;
  releaseDate: string | null;
  cardCount: number;
  languages: string;
  setCode?: string;
  imageUrl: string;
}

/**
 * DTO: Precio actual de una carta
 * Estructura simple para mostrar en listados y detalles
 */
export interface CurrentPriceDto {
  amount: number | null;
  currency: string;
  label: string; // "Market", "Mid", "Low"
}

/**
 * DTO: Card para listado y tabla
 * Información mínima para mostrar en listados
 */
export interface CardDto {
  id: string;
  name: string;
  number: string;
  imageUrl: string;
  currentPrice: CurrentPriceDto;
  set: {
    id: string;
    name: string;
  };
}

/**
 * DTO: Ataque de una carta
 */
export interface CardAttackDto {
  name: string;
  damage: string | null;
  text: string | null;
  cost: string[];
}

/**
 * DTO: Habilidad de una carta
 */
export interface CardAbilityDto {
  name: string;
  type: string;
  text: string;
}

/**
 * DTO: Debilidad o resistencia
 */
export interface CardWeaknessDto {
  type: string;
  value: string;
}

/**
 * DTO: Detalle completo de una carta
 * Incluye toda la información para la página de detalle
 */
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
