#!/bin/bash
# Script para insertar sets japoneses en PostgreSQL

psql -U pokemon pokemontcg <<EOF
-- Insertar sets japoneses
INSERT INTO sets (id, canonical_code, name, series, release_date, printed_total, total, language, metadata, created_at, updated_at) VALUES
  (gen_random_uuid(), 'ja:NS', 'Ninja Spinner', 'Sword & Shield', '2021-05-28'::date, 145, 145, 'ja', '{"source":"manual"}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'ja:MD', 'Mega Dream ex', 'Sword & Shield', '2022-07-15'::date, 186, 186, 'ja', '{"source":"manual"}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'ja:IX', 'Inferno X', 'Sword & Shield', '2022-08-05'::date, 184, 184, 'ja', '{"source":"manual"}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'ja:GTR', 'Glory of the Team Rocket', 'Sword & Shield', '2022-07-15'::date, 163, 163, 'ja', '{"source":"manual"}'::jsonb, NOW(), NOW())
ON CONFLICT (canonical_code) DO NOTHING;

-- Verificar
SELECT COUNT(*) as total, 
       COUNT(*) FILTER(WHERE language='ja') as japanese_sets,
       COUNT(*) FILTER(WHERE language='en') as english_sets
FROM sets;
EOF
