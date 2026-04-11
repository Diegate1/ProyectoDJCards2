-- ================================================
-- QUERY PARA MONITOREAR PROGRESO DE CARGA TCGTracking
-- ================================================

-- 1. RESUMEN: Top 20 Sets con más cartas
SELECT 
  s.name as "📌 Set",
  COUNT(c.id) as "📊 Cartas",
  COUNT(CASE WHEN c.image_small_url IS NOT NULL THEN 1 END) as "🖼️  Con Imagen",
  ROUND(100.0 * COUNT(CASE WHEN c.image_small_url IS NOT NULL THEN 1 END) / 
    NULLIF(COUNT(c.id), 0), 1) as "📈 % Imágenes",
  s.release_date as "📅 Fecha"
FROM sets s
LEFT JOIN cards c ON s.id = c.set_id
LEFT JOIN set_external_refs ref ON s.id = ref.set_id AND ref.source_code = 'tcgtracking'
WHERE s.language = 'ja' AND ref.source_code = 'tcgtracking'
GROUP BY s.id, s.name, s.release_date
ORDER BY COUNT(c.id) DESC
LIMIT 20;

-- 2. ESTADÍSTICAS GENERALES
SELECT 
  'TOTAL TCGTRACKING' as "Métrica",
  COUNT(DISTINCT s.id) as "Sets",
  COUNT(DISTINCT c.id) as "Cartas",
  COUNT(DISTINCT CASE WHEN c.image_small_url IS NOT NULL THEN c.id END) as "Con Imágenes"
FROM sets s
LEFT JOIN cards c ON s.id = c.set_id
LEFT JOIN set_external_refs ref ON s.id = ref.set_id AND ref.source_code = 'tcgtracking'
WHERE s.language = 'ja' AND ref.source_code = 'tcgtracking';

-- 3. VER CARTAS DEL SET M4: NINJA SPINNER
SELECT 
  c.number as "Número",
  c.name as "Nombre",
  c.rarity as "Rareza",
  CASE WHEN c.image_small_url IS NOT NULL THEN '✓' ELSE '✗' END as "Imagen",
  c.image_small_url as "URL"
FROM cards c
JOIN sets s ON c.set_id = s.id
WHERE s.name = 'M4: Ninja Spinner'
ORDER BY c.number
LIMIT 50;
