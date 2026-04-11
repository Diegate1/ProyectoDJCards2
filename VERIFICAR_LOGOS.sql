-- ================================================
-- VERIFICAR LOGOS DE SETS TCGTracking
-- ================================================

-- 1. Contar sets con y sin logo
SELECT 
  'LOGOS TCGTracking' as tipo,
  COUNT(*) as total,
  COUNT(CASE WHEN logo_image_url IS NOT NULL THEN 1 END) as con_logo,
  COUNT(CASE WHEN logo_image_url IS NULL THEN 1 END) as sin_logo,
  ROUND(100.0 * COUNT(CASE WHEN logo_image_url IS NOT NULL THEN 1 END) / 
    NULLIF(COUNT(*), 0), 1) as porcentaje_completo
FROM sets s
WHERE language = 'ja'
  AND EXISTS (
    SELECT 1 FROM set_external_refs ref
    WHERE ref.set_id = s.id AND ref.source_code = 'tcgtracking'
  );

-- 2. Top 10: Sets con logos
SELECT 
  s.name as "Set",
  CASE WHEN s.logo_image_url IS NOT NULL THEN '✓' ELSE '✗' END as "Logo",
  s.logo_image_url as "URL"
FROM sets s
WHERE s.language = 'ja'
  AND EXISTS (
    SELECT 1 FROM set_external_refs ref
    WHERE ref.set_id = s.id AND ref.source_code = 'tcgtracking'
  )
ORDER BY s.logo_image_url DESC NULLS LAST
LIMIT 20;

-- 3. M4, M3, MP1 específicos
SELECT 
  s.name,
  CASE WHEN s.logo_image_url IS NOT NULL THEN '✓' ELSE '✗' END as "Logo",
  s.logo_image_url as "URL"
FROM sets s
WHERE s.name IN ('M4: Ninja Spinner', 'M3: Nihil Zero', 'MP1: Start Deck 100 Battle Collection CoroCiao Version');
