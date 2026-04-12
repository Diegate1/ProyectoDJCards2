# 🧹 ARCHIVOS CANDIDATOS A ELIMINACIÓN (OPCIONAL)

**Nota:** Estos archivos NO se han eliminado aún. Esta es una lista para que el usuario decida.

---

## ⚠️ ADVERTENCIA

Estos archivos están **documentados como obsoletos** en CLEANUP_LOG.md pero aún existen.

Si deseas eliminarlos, ejecuta los comandos de la sección correspondiente.

**NO elimines nada sin revisar primero.**

---

## 📄 DOCUMENTACIÓN OBSOLETA (14 archivos)

Estos archivos fueron consolidados en DEVELOPER_GUIDE.md y otros.

### Para eliminar:

```bash
rm CODEBASE_MAP.md
rm STATUS_FINAL.md
rm CLEANUP_PLAN.md
rm SYNC_STRATEGY.md
rm DEPLOYMENT_RENDER.md
rm RENDER_DEPLOYMENT_GUIDE.md
rm RENDER_OPTIMIZATION_DETAILS.md
rm RENDER_OPTIMIZATION_SUMMARY.md
rm DOCKER_SETUP.md
rm EXECUTIVE_SUMMARY.md
rm GIT_PUSH_INSTRUCTIONS.md
rm INSTRUCCIONES_GIT.md
rm PORTS_CONFIG.md
rm QUICKSTART_FRONTEND.md
```

**Razón:** Información consolidada en DEVELOPER_GUIDE.md, Render.md, etc.  
**Riesgo:** BAJO (solo documentación)  
**Impacto:** Carpeta raíz más limpia (-70 KB aprox)

---

## 🐍 SCRIPTS DE TEST & VALIDACIÓN

Estos scripts nunca se ejecutan y son artifacts históricos.

### Para eliminar:

```bash
rm test-api-languages.ts
rm validate-frontend.ts
rm frontend/src/test-languages.html
rm load-sets.sh
```

**Razón:** Nunca usados, artifacts del desarrollo  
**Riesgo:** BAJO (no están en package.json)  
**Impacto:** -4 archivos, ~5 KB

---

## 🐚 SHELL SCRIPTS SIN USO

Estos scripts shell no se usan (funcionalidad en TypeScript).

### Para eliminar:

```bash
rm fetch-japanese-data.sh
rm insert-japanese.sh
rm docker-manager.sh  # Solo si estás seguro de que no lo necesitas
```

**Razón:** Funcionalidad duplicada en sync scripts  
**Riesgo:** MEDIO (revisar docker-manager.sh primero)  
**Impacto:** -3 archivos, ~2 KB

---

## 📁 SCRIPTS LEGACY EN `/scripts/` (OPCIONAL)

Estos scripts fueron usado para migraciones una sola vez (April 2026).

**NO están en npm scripts, así que son seguros.**

### Para archivar/eliminar:

```bash
# Scripts one-time (solo para April 2026 setup)
rm scripts/create-set-language-mappings.ts
rm scripts/scrape-m2a-tcgcollector.ts

# Migraciones legacy (solo para April 2026)
rm scripts/migration/load-m2a-complete.ts
rm scripts/migration/load-m2a-manual.ts
rm scripts/migration/backfill-m2a-images.ts
rm scripts/migration/clean-tcgtracking.ts

# Legacy sync scripts
rm scripts/sync-japanese-tcgdex.ts
rm scripts/sync-japanese-sets-manual.ts
rm scripts/sync-single-set.ts
```

**Razón:** Migraciones one-time, funcionalidad disponible en scripts activos  
**Riesgo:** BAJO (documentado en CLEANUP_LOG.md)  
**Impacto:** -8 archivos, ~20 KB

---

## 🐛 DEBUG SCRIPTS (MANTENER?)

Estos scripts están en `/scripts/debug/` y SON ÚTILES para troubleshooting.

### Opción 1: Mantener (RECOMENDADO)
```bash
# Dejar como está - son útiles para debugging
# Están documentados en scripts/README.md
```

### Opción 2: Si deseas archivar
```bash
# Crear directorio para historial
mkdir -p deprecated/debug-archive

# Mover debug scripts
mv scripts/debug/*.ts deprecated/debug-archive/

# Actualizar scripts/README.md para referenciar ubicación nueva
```

**Decisión:** MANTENER (son útiles)

---

## 📊 RESUMEN DE LIMPIEZA OPCIONAL

```
TOTAL ARCHIVOS CANDIDATOS A ELIMINAR:

1. Documentación obsoleta:     14 archivos (.md)
2. Test/validation scripts:    4 archivos
3. Shell scripts sin uso:      3 archivos
4. Scripts legacy:            8 archivos (migrate)
────────────────────────
TOTAL:                        29 archivos candidatos

TAMAÑO APROX: ~100 KB

RIESGO: BAJO (todo documentado)
IMPACTO: Carpeta más limpia sin perder funcionalidad
```

---

## 🔄 RECOMENDACIÓN

### Opción A: Conservador (Recomendado para ahora)

✅ **MANTENER TODO**
- Documentación obsoleta (no molesta)
- Scripts legacy (documentado, no se ejecutan)
- Debug scripts (útiles para troubleshooting)

**Ventaja:** Cero riesgo, puedes recuperar cosas si las necesitas  
**Desventaja:** Carpeta más "sucia" (pero documentada)

### Opción B: Agresivo (Si estás seguro)

🗑️ **ELIMINAR TODO**
- Documentación obsoleta (consolidada)
- Scripts test/validation (nunca usados)
- Scripts shell (deprecado)
- Scripts legacy (one-time migrations)

```bash
# Complete cleanup script
rm CODEBASE_MAP.md STATUS_FINAL.md CLEANUP_PLAN.md \
   SYNC_STRATEGY.md DEPLOYMENT_RENDER.md \
   RENDER_DEPLOYMENT_GUIDE.md RENDER_OPTIMIZATION_*.md \
   DOCKER_SETUP.md EXECUTIVE_SUMMARY.md \
   GIT_PUSH_INSTRUCTIONS.md INSTRUCCIONES_GIT.md \
   PORTS_CONFIG.md QUICKSTART_FRONTEND.md \
   test-api-languages.ts validate-frontend.ts \
   load-sets.sh fetch-japanese-data.sh insert-japanese.sh \
   frontend/src/test-languages.html \
   scripts/create-set-language-mappings.ts \
   scripts/scrape-m2a-tcgcollector.ts \
   scripts/sync-japanese-tcgdex.ts \
   scripts/sync-japanese-sets-manual.ts \
   scripts/sync-single-set.ts \
   scripts/migration/load-m2a-*.ts \
   scripts/migration/backfill-m2a-images.ts \
   scripts/migration/clean-tcgtracking.ts

# Optional - archive docker-manager.sh review first
# rm docker-manager.sh
```

**Ventaja:** Carpeta muy limpia  
**Desventaja:** Pierdes artifacts históricos (pero BACKUP primero!)

### Opción C: Intermedio (Recomendado si estás seguro)

🗂️ **ELIMINAR docs obsoletos + test scripts**
**MANTENER** scripts legacy (por si acaso)

```bash
# Eliminar solo documentación obsoleta
rm CODEBASE_MAP.md STATUS_FINAL.md CLEANUP_PLAN.md \
   SYNC_STRATEGY.md DEPLOYMENT_RENDER.md \
   RENDER_DEPLOYMENT_GUIDE.md RENDER_OPTIMIZATION_*.md \
   DOCKER_SETUP.md EXECUTIVE_SUMMARY.md \
   GIT_PUSH_INSTRUCTIONS.md INSTRUCCIONES_GIT.md \
   PORTS_CONFIG.md QUICKSTART_FRONTEND.md

# Eliminar test/validation scripts
rm test-api-languages.ts validate-frontend.ts \
   load-sets.sh fetch-japanese-data.sh insert-japanese.sh \
   frontend/src/test-languages.html

# MANTENER scripts legacy en /scripts/ (documentados)
```

---

## ✅ RECOMENDACIÓN FINAL DEL EQUIPO

**Opción A: Conservador** 👈 RECOMENDADO POR AHORA

**Razón:**
- ✅ Project está completamente documentado
- ✅ Legacy scripts no interfieren
- ✅ Cero riesgo
- ✅ Puedes limpiar después si quieres

**Cuándo cambiar a B o C:**
- Cuando estés 100% seguro de que no necesitas los artifacts
- Cuando tengas el proyecto en Git/Backup
- Cuando lo haya usado otro developer sin problemas

---

## 🔄 ANTES DE ELIMINAR ANYTHING

**Backup primero:**

```bash
# Option 1: Git (recomendado)
git add . && git commit -m "Backup antes de cleanup final"

# Option 2: Manual backup
cp -r ProyectoDJCards2 ProyectoDJCards2.backup
```

---

## 📝 COMANDOS PARA CADA OPCIÓN

### Opción A: Conservador (NO HACER NADA)
```bash
# Todo ya está documentado. Listo.
git add . && git commit -m "Project cleanup complete - documented"
```

### Opción B: Agresivo
```bash
# Ver lo que se va a eliminar
cat /ARCHIVOS_A_ELIMINAR_OPCION_B.txt

# Luego ejecutar el script de eliminación
# (o hacerlo manualmente)
```

### Opción C: Intermedio
```bash
# Ver lo que se va a eliminar  
cat /ARCHIVOS_A_ELIMINAR_OPCION_C.txt

# Ejecutar eliminación
# (ver script arriba)

# Commit
git add . && git commit -m "Clean up obsolete docs and test scripts"
```

---

## ❓ DECISION

¿Qué opción prefieres?

| Opción | Comando | Riesgo | Limpieza |
|--------|---------|--------|----------|
| A (Conservador) | `# Nada` | CERO | 30% |
| C (Intermedio) | Ejecutar script C | BAJO | 70% |
| B (Agresivo) | Ejecutar script B | BAJO | 95% |

**Recomendación:** A ahora, B o C después (cuando estés confiado)

---

**Última actualización:** 12 Abril 2026

**Status:** Lista preparada, esperando tu decisión
