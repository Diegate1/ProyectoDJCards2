-- Insertar sets japoneses
INSERT INTO sets (id, canonical_code, name, series, release_date, printed_total, total, language, metadata, created_at, updated_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'ja:NS', 'Ninja Spinner', 'Sword & Shield', '2021-05-28'::date, 145, 145, 'ja', '{"source":"manual","jpCode":"S4a"}'::jsonb, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'ja:MD', 'Mega Dream ex', 'Sword & Shield', '2022-07-15'::date, 186, 186, 'ja', '{"source":"manual","jpCode":"S7D"}'::jsonb, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'ja:IX', 'Inferno X', 'Sword & Shield', '2022-08-05'::date, 184, 184, 'ja', '{"source":"manual","jpCode":"S7R"}'::jsonb, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, 'ja:GTR', 'Glory of the Team Rocket', 'Sword & Shield', '2022-07-15'::date, 163, 163, 'ja', '{"source":"manual","jpCode":"S7L"}'::jsonb, NOW(), NOW())
ON CONFLICT (canonical_code) DO NOTHING;

-- Verificar inserción
SELECT COUNT(*) as total_sets, 
       COUNT(*) FILTER (WHERE language = 'ja') as japanese_sets,
       COUNT(*) FILTER (WHERE language = 'en') as english_sets
FROM sets;
