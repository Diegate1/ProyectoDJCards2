# 📋 Estrategia de Sincronización de Sets - ProyectoDJCards2

## ✅ LO QUE FUNCIONA

### Método Correcto: `sync:set` por Set Individual
El comando que funciona **perfectamente** es sincronizar sets **uno a uno** desde **Pokemon TCG API**:

```bash
docker-compose exec backend npm run sync:set -- {SET_CODE}
```

**Ventajas:**
- ✅ Datos completos y verificados
- ✅ Cargas rápidas (10-30 segundos por set)
- ✅ Sin errores 404
- ✅ Todas las cartas se sincronisan correctamente

---

## 🔧 CÓMO FUNCIONA

### Paso 1: Obtener Código del Set
```bash
# Buscar en Pokemon TCG API
curl "https://api.pokemontcg.io/v2/sets?q=name:{NOMBRE}"

# Ejemplo - Ascended Heroes
curl "https://api.pokemontcg.io/v2/sets?q=name:Ascended" | jq '.data[0].id'
# Resultado: me2pt5
```

### Paso 2: Sincronizar el Set Completo
```bash
docker-compose exec backend npm run sync:set -- me2pt5
```

**Resultado:**
- Pokemon TCG API sincroniza 207+ sets base automáticamente
- Luego carga todas las cartas del set específico
- **Ascended Heroes:** 295 cartas ✅

### Paso 3: Verificar Datos
```bash
docker-compose exec postgres psql -U pokemon -d pokemontcg \
  -c "SELECT COUNT(*) as total_cards, COUNT(DISTINCT set_id) as unique_sets FROM cards;"
```

---

## 🎯 SETS PRINCIPALES A CARGAR

| Nombre | Código | Cartas | Comando |
|--------|--------|--------|---------|
| Ascended Heroes | me2pt5 | 295 | `npm run sync:set -- me2pt5` |
| Paldean Fates | sv04pt | 280+ | `npm run sync:set -- sv04pt` |
| Crown Zenith | sv4pt5 | 200+ | `npm run sync:set -- sv4pt5` |
| Paradox Rift | sv05 | 220+ | `npm run sync:set -- sv05` |

---

## 🚀 EJECUCIÓN EN BATCH

Para cargar múltiples sets:

```bash
# En background, uno tras otro
docker-compose exec -d backend bash -c "\
  npm run sync:set -- me2pt5 && \
  npm run sync:set -- sv04pt && \
  npm run sync:set -- sv4pt5 && \
  npm run sync:set -- sv05"
```

O ejecutar manualmente cada uno esperando a que termine:

```bash
docker-compose exec backend npm run sync:set -- me2pt5
# Esperar a que termine...
docker-compose exec backend npm run sync:set -- sv04pt
# Etc.
```

---

## ✅ VERIFICACIÓN
```bash
# Ver progreso en tiempo real
watch -n 5 'docker-compose exec postgres psql -U pokemon -d pokemontcg -c "SELECT COUNT(*) FROM cards;"'

# O manual
docker-compose exec postgres psql -U pokemon -d pokemontcg -c "SELECT COUNT(*) as total_cards FROM cards;"
```

---

## ⚡ RESUMEN
- **Lo que funciona:** `npm run sync:set -- {CODE}` desde Pokemon TCG API
- **Lo que NO funciona:** TCGdex (incompleto, muchos 404)
- **Recomendación:** Cargar sets populares uno a uno
