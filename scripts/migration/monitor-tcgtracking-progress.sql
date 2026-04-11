-- ================================================
-- SELECT para monitorear progreso de carga TCGTracking
-- ================================================

-- 1. RESUMEN GENERAL: Sets vs Cartas
SELECT 
  'RESUMEN GENERAL' as tipo,
  COUNT(DISTINCT s.id) as total_sets,
  COUNT(DISTINCT c.id) as total_cartas,
  COUNT(DISTINCT c.id) FILTER (WHERE c.id IS NULL) as sets_sin_cartas,
  ROUND(100.0 * COUNT(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL) / 
    NULLIF(COUNT(DISTINCT s.id), 0), 2) as porcentaje_completado
FROM sets s
LEFT JOIN cards c ON s.id = c.set_id
WHERE s.language = 'ja'
  AND EXISTS (
    SELECT 1 FROM set_external_refs ref 
    WHERE ref.set_id = s.id AND ref.source_code = 'tcgtracking'
  );

-- 2. ESTADO POR SET (top 20 sets más completos)
SELECT 
  s.name as "Nombre del Set",
  s.canonical_code as "Código",
  COUNT(c.id) as "Cartas",
  COALESCE(s.metadata->>'product_count', 'N/A') as "Productos Esperados",
  CASE 
    WHEN COUNT(c.id) > 0 THEN '✓ Con cartas'
    ELSE '⏳ Sin cartas'
  END as "Estado",
  s.release_date as "Fecha",
  s.updated_at as "Última actualización"
FROM sets s
LEFT JOIN cards c ON s.id = c.set_id
LEFT JOIN set_external_refs ref ON s.id = ref.set_id AND ref.source_code = 'tcgtracking'
WHERE s.language = 'ja'
  AND ref.source_code = 'tcgtracking'
GROUP BY s.id, s.name, s.canonical_code, s.metadata, s.release_date, s.updated_at
ORDER BY COUNT(c.id) DESC, s.name ASC
LIMIT 20;

-- 3. ESTADÍSTICAS DE PROGRESO EN TIEMPO REAL
SELECT 
  'PROGRESO' as tipo,
  COUNT(DISTINCT s.id) as "Total Sets Cargados",
  COUNT(DISTINCT CASE WHEN c.id IS NOT NULL THEN s.id END) as "Sets con Cartas",
  COUNT(DISTINCT c.id) as "Total Cartas",
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN c.id IS NOT NULL THEN s.id END) / 
    NULLIF(COUNT(DISTINCT s.id), 0), 1) as "% Sets Procesados",
  MAX(s.updated_at) as "Última actualización",
  MAX(c.created_at) as "Última carta agregada"
FROM sets s
LEFT JOIN cards c ON s.id = c.set_id
LEFT JOIN set_external_refs ref ON s.id = ref.set_id AND ref.source_code = 'tcgtracking'
WHERE s.language = 'ja'
  AND ref.source_code = 'tcgtracking';

-- 4. SETS SIN CARTAS (para debugging)
SELECT 
  s.name as "Set",
  s.canonical_code as "Código",
  ref.external_id as "TCGTracking ID",
  COUNT(c.id) as "Cartas",
  s.created_at as "Creado",
  s.updated_at as "Actualizado"
FROM sets s
LEFT JOIN cards c ON s.id = c.set_id
LEFT JOIN set_external_refs ref ON s.id = ref.set_id AND ref.source_code = 'tcgtracking'
WHERE s.language = 'ja'
  AND ref.source_code = 'tcgtracking'
  AND c.id IS NULL
ORDER BY s.name
LIMIT 30;

-- 5. CARTAS CON IMÁGENES vs SIN IMÁGENES
SELECT 
  COUNT(*) as "Total Cartas",
  COUNT(CASE WHEN image_small_url IS NOT NULL THEN 1 END) as "Con Imagen",
  COUNT(CASE WHEN image_small_url IS NULL THEN 1 END) as "Sin Imagen",
  ROUND(100.0 * COUNT(CASE WHEN image_small_url IS NOT NULL THEN 1 END) / 
    NULLIF(COUNT(*), 0), 1) as "% con Imagen"
FROM cards c
WHERE EXISTS (
  SELECT 1 FROM set_external_refs ref
  WHERE ref.set_id = c.set_id AND ref.source_code = 'tcgtracking'
);

-- 6. ÚLTIMAS CARTAS AGREGADAS (para ver si está en proceso)
SELECT 
  c.name as "Carta",
  s.name as "Set",
  c.card_number as "Número",
  c.rarity as "Rareza",
  c.image_small_url as "Imagen URL",
  c.created_at as "Creado",
  c.updated_at as "Actualizado"
FROM cards c
JOIN sets s ON c.set_id = s.id
WHERE EXISTS (
  SELECT 1 FROM set_external_refs ref
  WHERE ref.set_id = s.id AND ref.source_code = 'tcgtracking'
)
ORDER BY c.created_at DESC
LIMIT 20;
