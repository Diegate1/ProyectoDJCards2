-- 001_initial_schema.sql
-- Tables para almacenar datos de las tres APIs

-- Tabla de fuentes de datos
CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserts de fuentes
INSERT INTO sources (code, name) VALUES 
  ('pokemontcg', 'Pokémon TCG API'),
  ('tcgdex', 'TCGdex'),
  ('tcgcsv', 'TCGCSV / TCGplayer')
ON CONFLICT DO NOTHING;

-- Tabla canónica de sets
CREATE TABLE IF NOT EXISTS sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_code VARCHAR(100) UNIQUE,
  name VARCHAR(255) NOT NULL,
  series VARCHAR(255),
  release_date DATE,
  printed_total INT,
  total INT,
  symbol_image_url TEXT,
  logo_image_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de referencias externas de sets
CREATE TABLE IF NOT EXISTS set_external_refs (
  id BIGSERIAL PRIMARY KEY,
  set_id UUID REFERENCES sets(id) ON DELETE CASCADE,
  source_code VARCHAR(50) NOT NULL,
  external_id VARCHAR(255) NOT NULL,
  external_code VARCHAR(255),
  external_name VARCHAR(255),
  raw_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (source_code, external_id)
);

-- Tabla canónica de cartas
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  canonical_card_code VARCHAR(255),
  number VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  supertype VARCHAR(100),
  rarity VARCHAR(100),
  artist VARCHAR(255),
  hp VARCHAR(10),
  flavor_text TEXT,
  image_small_url TEXT,
  image_large_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (set_id, number, name)
);

-- Tabla de referencias externas de cartas
CREATE TABLE IF NOT EXISTS card_external_refs (
  id BIGSERIAL PRIMARY KEY,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  source_code VARCHAR(50) NOT NULL,
  external_id VARCHAR(255) NOT NULL,
  local_number VARCHAR(50),
  raw_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (source_code, external_id)
);

-- Tabla de ataques de carta
CREATE TABLE IF NOT EXISTS card_attacks (
  id BIGSERIAL PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  position INT NOT NULL,
  name VARCHAR(255),
  text TEXT,
  damage VARCHAR(50),
  cost JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de habilidades de carta
CREATE TABLE IF NOT EXISTS card_abilities (
  id BIGSERIAL PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  name VARCHAR(255),
  type VARCHAR(100),
  text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos (TCGplayer, sealed, etc)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID REFERENCES sets(id) ON DELETE SET NULL,
  source_code VARCHAR(50) NOT NULL,
  external_product_id VARCHAR(255) NOT NULL,
  group_external_id VARCHAR(255),
  name VARCHAR(500) NOT NULL,
  clean_name VARCHAR(500),
  product_type VARCHAR(50) NOT NULL CHECK (product_type IN ('single_card', 'sealed_product', 'unknown')),
  image_url TEXT,
  product_url TEXT,
  presale_json JSONB,
  extended_data_raw JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (source_code, external_product_id)
);

-- Tabla de precios de productos
CREATE TABLE IF NOT EXISTS product_prices (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name VARCHAR(255) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  low_price NUMERIC(12, 2),
  mid_price NUMERIC(12, 2),
  high_price NUMERIC(12, 2),
  market_price NUMERIC(12, 2),
  direct_low_price NUMERIC(12, 2),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (product_id, variant_name, captured_at)
);

-- Tabla de logs de API
CREATE TABLE IF NOT EXISTS api_logs (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  method VARCHAR(10) NOT NULL,
  url TEXT NOT NULL,
  status_code INT,
  request_headers JSONB,
  request_params JSONB,
  response_headers JSONB,
  response_body JSONB,
  error_text TEXT,
  duration_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_sets_canonical_code ON sets(canonical_code);
CREATE INDEX IF NOT EXISTS idx_sets_name ON sets(name);
CREATE INDEX IF NOT EXISTS idx_set_external_refs_set_id ON set_external_refs(set_id);
CREATE INDEX IF NOT EXISTS idx_set_external_refs_source ON set_external_refs(source_code);
CREATE INDEX IF NOT EXISTS idx_cards_set_id ON cards(set_id);
CREATE INDEX IF NOT EXISTS idx_cards_number ON cards(number);
CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);
CREATE INDEX IF NOT EXISTS idx_card_external_refs_card_id ON card_external_refs(card_id);
CREATE INDEX IF NOT EXISTS idx_card_external_refs_source ON card_external_refs(source_code);
CREATE INDEX IF NOT EXISTS idx_products_set_id ON products(set_id);
CREATE INDEX IF NOT EXISTS idx_products_source ON products(source_code);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_product_prices_product_id ON product_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_provider ON api_logs(provider);
CREATE INDEX IF NOT EXISTS idx_api_logs_status ON api_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at);
