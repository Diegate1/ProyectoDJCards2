# 🧹 Plan de Limpieza y Preparación para Render

**Fecha:** Abril 11, 2026  
**Objetivo:** Limpiar código muerto, documentación antigua y preparar para deployment en Render

---

## ✅ ACCIONES A REALIZAR

### 1. DOCUMENTACIÓN: CONSOLIDAR Y REDUCIR

**Arhivos a ELIMINAR (documentación antigua/redundante):**
- ❌ `CARGA_DATOS_COMPLETADA.md` - Reporte completado, información antigua
- ❌ `CHECKLIST.md` - Checklist de desarrollo, no aplica a estado actual
- ❌ `DOCKER_CHANGES.md` - Cambios históricos, no es útil
- ❌ `DOCKER_CHECKLIST.md` - Checklist completado
- ❌ `CHINESE_SUPPORT.md` - Resumen de implementación, redundante con docs finales
- ❌ `Contexto.md` - Contexto de desarrollo inicial
- ❌ `TEST_REPORT.md` - Reporte de testing antiguo
- ❌ `FILTROS_TEST_REPORT.md` - Reporte antiguo
- ❌ `IMPLEMENTATION_SUMMARY.md` - Resumen de implementación (redundante)
- ❌ `TCGTRACKING_IMPLEMENTATION.md` - Detalles de implementación (versión anterior)
- ❌ `SUMMARY_TCGTRACKING.md` - Resumen antiguo
- ❌ `QUICK_START_TCGTRACKING.md` - Guía de TCGTracking (integrada en docs finales)
- ❌ `tcgtracking.md` - Notas de TCGTracking (versión anterior)
- ❌ `pokemontcg_api_guide.md` - Guía API antigua (info integrada)
- ❌ `REPORTE_ESTRUCTURA_DATOS.md` - Reporte de estructura (versión anterior)
- ❌ `sync_*.txt` archivos - Outputs de sincronización (no son código)
- ❌ `VERIFICATION*.sql` - Scripts de verificación (no documentación)

**Archivos a MANTENER Y ACTUALIZAR:**
- ✅ `README.md` - Guía principal (SIMPLIFICAR Y ACTUALIZAR)
- ✅ `README_ADMIN.md` - Documentación de endpoints admin (REVISIONAR)
- ✅ `QUICKSTART.md` - Guía rápida (ACTUALIZAR)
- ✅ `DOCKER_SETUP.md` - Setup de Docker (REVISAR PARA RENDER)
- ✅ `SYNC_STRATEGY.md` - Estrategia de sync (AMPLIAR CON MÉTODOS CLAROS)

**Archivos a CREAR:**
- 🆕 `DEPLOYMENT_RENDER.md` - Guía específica para Render
- 🆕 `SYNC_METHODS.md` - Documentación clara de 3 métodos de sync

---

### 2. CÓDIGO: SCRIPTS DE SYNC (LIMPIAR DUPLICADOS)

**Scripts MANTENER (activos):**
- ✅ `scripts/sync-set.ts` - Single set sync (Pokemon TCG API)
- ✅ `scripts/sync-tcgdex.ts` - Multi-language sync (EN, JA)
- ✅ `scripts/sync-tcgdex-chinese-v2.ts` - Chinese sync (V2, mejorado)
- ✅ `scripts/sync-tcgtracking-sets.ts` - Japanese sets (TCGTracking)
- ✅ `scripts/sync-tcgtracking-cards.ts` - Japanese cards (TCGTracking)
- ✅ `scripts/full-sync.ts` - Orchestrated complete sync

**Scripts a ELIMINAR (duplicados/deprecated):**
- ❌ `scripts/sync-japanese-tcgdex.ts` - Duplicado (función en sync-tcgdex.ts)
- ❌ `scripts/sync-japanese-sets-manual.ts` - Deprecated
- ❌ `scripts/sync-tcgdex-chinese-sets.ts` - Reemplazado por v2
- ❌ `scripts/sync-tcgdex-chinese-cards.ts` - Reemplazado por v2
- ❌ `scripts/sync-tcgdex-chinese-v1.ts` - Si existe, es deprecated

**Scripts DEBUG a MOVER (crear folder /scripts/debug/):**
- 📁 `scripts/debug-tcgtracking-api.ts` → `scripts/debug/tcgtracking-api.ts`
- 📁 `scripts/debug-logo-sources.ts` → `scripts/debug/logo-sources.ts`
- 📁 `scripts/debug-chinese-structure.ts` → `scripts/debug/chinese-structure.ts`
- 📁 `scripts/check-*.ts` (todos) → `scripts/debug/check-*.ts`
- 📁 `scripts/investigate-*.ts` (todos) → `scripts/debug/investigate-*.ts`

**Scripts DATA MIGRATION a MOVER (crear folder /scripts/migration/):**
- 📁 `scripts/load-*.ts` → `scripts/migration/load-*.ts`
- 📁 `scripts/migrate.ts` → `scripts/migration/migrate.ts`
- 📁 `scripts/backfill-*.ts` → `scripts/migration/backfill-*.ts`
- 📁 `scripts/*.sql` → `scripts/migration/*.sql`

**Scripts ANÁLISIS a MOVER (crear folder /scripts/analysis/):**
- 📁 `scripts/analyze-*.ts` → `scripts/analysis/analyze-*.ts`
- 📁 `scripts/research-*.ts` → `scripts/analysis/research-*.ts`

---

### 3. PACKAGE.JSON: LIMPIAR NPM SCRIPTS

**Cambios en package.json:**

```diff
- "sync:tcgdex:zh": "ts-node scripts/sync-tcgdex-chinese-sets.ts && ts-node scripts/sync-tcgdex-chinese-cards.ts"  ❌ Duplicado
- "sync:tcgdex:zh:sets": "ts-node scripts/sync-tcgdex-chinese-sets.ts"  ❌ Deprecated
- "sync:tcgdex:zh:cards": "ts-node scripts/sync-tcgdex-chinese-cards.ts"  ❌ Deprecated
- "sync:tcgdex:zh:v2": "ts-node scripts/sync-tcgdex-chinese-v2.ts"  ❌ Rename

+ "sync:tcgdex:zh": "ts-node scripts/sync-tcgdex-chinese-v2.ts"  ✅ Single source
+ "sync:japanese": "npm run sync:tcgtracking:sets && npm run sync:tcgtracking:cards"  ✅ New: grouped

// Agregar comentarios para claridad:
// === ENGLISH SYNC ===
"sync:english": "ts-node scripts/sync-tcgdex.ts en"
// === JAPANESE SYNC ===
"sync:japanese": ...
// === CHINESE SYNC ===
"sync:chinese": ...
// === FULL ORCHESTRATED SYNC ===
"sync:full": ...
```

---

### 4. ARCHIVOS TEMPORALES: ELIMINAR

**A BORRAR:**
- ❌ `sync_debug.txt`
- ❌ `sync_jp.txt`
- ❌ `sync_output.txt`
- ❌ `sync-debug.txt`
- ❌ `sync-debug2.txt`
- ❌ `sync-full-output.txt`
- ❌ `sync-full.txt`

---

### 5. DOCKER: CONFIGURAR PARA RENDER

**Cambios necesarios en docker-compose.yml:**
- ✅ Cambiar puerto backend de 3000 → variable ENV (para Render web services)
- ✅ Cambiar puerto frontend de 5173 → variable ENV
- ✅ Cambiar credentials de PostgreSQL (usar variables de entorno)
- ✅ Usar volumes nombrados, no anónimos
- ✅ Ajustar healthchecks para Render timeout

**Crear .env.render:**
- Variables específicas para Render
- Credenciales seguras
- URLs correctas para producción

---

## 📋 THREE SYNC METHODS (DOCUMENTAR CLARAMENTE)

### ✨ Método 1: ENGLISH SYNC (Pokemon TCG + TCGdex)
```bash
npm run sync:english
```
- **Source:** Pokemon TCG API + TCGdex EN
- **Scope:** Sets + Cards (in English)
- **Script:** scripts/sync-tcgdex.ts (flag: en)
- **Output:** English cards database entries

### 🇯🇵 Método 2: JAPANESE SYNC (TCGTracking + TCGdex)
```bash
npm run sync:japanese
```
- **Source 1:** TCGTracking API (sets from JP region)
- **Source 2:** TCGdex (Japanese translations)
- **Scope:** Japanese sets + cards + pricing
- **Scripts:** 
  - scripts/sync-tcgtracking-sets.ts
  - scripts/sync-tcgtracking-cards.ts
- **Output:** Japanese cards database entries

### 🇨🇳 Método 3: CHINESE SYNC (TCGdex Simplified)
```bash
npm run sync:chinese
```
- **Source:** TCGdex API (ZH = Simplified Chinese)
- **Scope:** Sets + Cards (in Simplified Chinese)
- **Script:** scripts/sync-tcgdex-chinese-v2.ts
- **Output:** Chinese cards database entries

### 🔄 Método 4 BONUS: FULL SYNC (Orchestrated)
```bash
npm run sync:full
```
- **Runs:** English → Japanese → Chinese (en secuencia)
- **Scope:** Sincronización completa de todas las fuentes
- **Script:** scripts/full-sync.ts
- **Output:** Base de datos completamente poblada

---

## 🚀 RENDER DEPLOYMENT CHECKLIST

- [ ] Docker-Compose actualizado
- [ ] .env.render creado con variables Render
- [ ] Health checks optimizados
- [ ] Documentación de deployment
- [ ] Scripts de sync en /scripts/sync/ solamente
- [ ] Código muerto eliminado
- [ ] Documentación consolidada
- [ ] README.md actualizado y simplificado
- [ ] package.json limpio con scripts claros
- [ ] Archivos temporales eliminados

---

## 📊 ANTES Y DESPUÉS (Estimado)

| Métrica | Antes | Después | % Reducción |
|---------|-------|---------|-------------|
| Archivos MD | 25 | 7 | 72% |
| Scripts /scripts/ | 30+ | 12 + /debug/, /migration/, /analysis/ | 60% |
| Líneas package.json scripts | 20+ | 10-12 | 50% |
| Archivos temporales | 8+ | 0 | 100% |

---

## ⏱️ ORDEN DE EJECUCIÓN

1. ✅ Crear carpetas: /scripts/debug/, /scripts/migration/, /scripts/analysis/
2. ✅ Mover scripts a sus carpetas correspondientes
3. ✅ Crear SYNC_METHODS.md con documentación clara
4. ✅ Crear DEPLOYMENT_RENDER.md
5. ✅ Actualizar package.json (eliminar duplicados, agregar agrupaciones)
6. ✅ Eliminar archivos MD antiguos
7. ✅ Eliminar archivos temporales (.txt)
8. ✅ Actualizar README.md (simplificar)
9. ✅ Revisar y actualizar docker-compose.yml
10. ✅ Crear .env.render
11. ✅ Actualizar Dockerfile (si necesario)
12. ✅ Verificación final

---

**Status:** 🟡 PENDIENTE EJECUCIÓN  
**Responsable:** Alex (AI Assistant)  
**Fecha Estimada Finalización:** Hoy (antes de 1 hora)
