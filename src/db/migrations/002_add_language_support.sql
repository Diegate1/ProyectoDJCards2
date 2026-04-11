-- 002_add_language_support.sql
-- Añade soporte para múltiples idiomas manteniendo compatibilidad hacia atrás

-- Añadir columna language a sets (default 'en' para sets existentes)
ALTER TABLE sets
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- Añadir columna language a set_external_refs para trackear qué idioma está cada referencia
ALTER TABLE set_external_refs
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- Actualizamos sets existentes de pokemontcg a language='en'
UPDATE sets
SET language = 'en'
WHERE language IS NULL;

-- Actualizamos referencias de pokemontcg a language='en'
UPDATE set_external_refs
SET language = 'en'
WHERE language IS NULL AND source_code = 'pokemontcg';

-- Crear índices para optimizar búsquedas por idioma
CREATE INDEX IF NOT EXISTS idx_sets_language ON sets(language);
CREATE INDEX IF NOT EXISTS idx_set_external_refs_language ON set_external_refs(language);
CREATE INDEX IF NOT EXISTS idx_set_external_refs_language_source ON set_external_refs(language, source_code);

-- Crear constraint para evitar duplicados de la misma región+fuente
CREATE UNIQUE INDEX IF NOT EXISTS uq_set_refs_language_source_id 
  ON set_external_refs(language, source_code, external_id)
  WHERE language IS NOT NULL;
