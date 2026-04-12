# 🔧 RENDER DEBUGGING GUIDE

**When backend deployment fails, use this guide to isolate and debug the issue**

---

## 🎯 Problem Symptoms

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "No open ports detected" | Server never listens | See: Test Server Startup |
| Build fails with errors | Docker build issue | See: Build Failures |
| Migrations hang/timeout | Database unavailable | See: Database Connection |
| "Cannot find module" | Import path wrong | See: TypeScript Errors |
| grep/sed errors | Alpine incompatibility | Verify latest code pulled |

---

## 🧪 TEST 1: Server Startup (Without Database)

**Goal:** Verify the Express server can start and listen on port 3000

**Steps in Render Dashboard:**

1. Go to Backend Service → Settings → Environment
2. Add or set these variables:
   ```
   SKIP_DATABASE=true
   SKIP_MIGRATIONS=true
   NODE_ENV=production
   PORT=3000
   ```
3. Set `FRONTEND_URL` and `API_BASE_URL` to dummy URLs (they won't be used)
4. Click "Save" → Backend will auto-redeploy
5. Watch Logs tab

**Expected output in logs:**
```
🚀 INICIANDO BACKEND - RENDER ENTRYPOINT
✓ Modo RENDER detectado
"⏭️  SKIP_MIGRATIONS=true, saltando migraciones"
✅ SERVER STARTED SUCCESSFULLY
📌 Listening on: http://0.0.0.0:3000
```

**If you see this and no errors → Server startup works! ✅**

**If it fails → Check:**
- `npm run start` works locally?
- Port 3000 listening?
- Check Logs for `npm` errors

---

## 🧪 TEST 2: Database Connection (Without Migrations)

**Goal:** Verify database credentials work and connection is possible

**Steps in Render Dashboard:**

1. Backend Service → Settings → Environment
2. Update variables:
   ```
   SKIP_DATABASE=false
   SKIP_MIGRATIONS=true
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://...    (from Render PostgreSQL panel)
   ```
3. Click "Save" → Backend will auto-redeploy
4. Watch Logs tab

**Expected output in logs:**
```
🔍 Parseando DATABASE_URL...
   User: d01j
   Host: dpg-d7ds4ihf9bms738biflg-a
   Port: 5432
   Database: pokemontcg_7wdx
✓ PostgreSQL LISTO
🔌 Connecting to database...
✓ Database connected
✅ SERVER STARTED SUCCESSFULLY
```

**If you see "Database connected" → Database works! ✅**

**If it fails with timeout:**
1. Check PostgreSQL Database → Status (should be "Available")
2. Wait 5 minutes (Render databases take time)
3. Verify DATABASE_URL copied exactly
4. Redeploy with Manual Deploy

---

## 🧪 TEST 3: Migrations (Full Test)

**Goal:** Verify migrations run successfully

**Steps in Render Dashboard:**

1. Backend Service → Settings → Environment
2. Update variables:
   ```
   SKIP_DATABASE=false
   SKIP_MIGRATIONS=false
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://...    (from Render PostgreSQL panel)
   ```
3. Click "Save" → Backend will auto-redeploy
4. Watch Logs tab

**Expected output in logs:**
```
🔍 Parseando DATABASE_URL...
✓ PostgreSQL LISTO
🔄 Ejecutando migraciones...
   Comando: npx ts-node scripts/migration/migrate.ts
════════════════════════════════════════════════════════
🔄 MIGRATION SCRIPT - Starting
🔌 Step 1: Connecting to database...
✓ Database connection established
🔄 Step 2: Running migrations...
✅ MIGRATION COMPLETED SUCCESSFULLY
🎉 INICIALIZACION COMPLETADA
✅ SERVER STARTED SUCCESSFULLY
```

**If you see "SERVER STARTED SUCCESSFULLY" with no errors → Full deployment works! ✅**

---

## 📊 Command Reference

### Render Dashboard Buttons

```
Backend Service → "Manual Deploy"     → Force rebuild + deploy
Backend Service → "Logs"              → See real-time logs
Backend Service → Settings → Variables → Edit environment variables
```

### Local Testing (Before Render)

```bash
# Test server startup locally (no database)
SKIP_DATABASE=true SKIP_MIGRATIONS=true npm run start

# Test with local database
DATABASE_URL=postgresql://user:pass@localhost:5432/pgdb npm run start

# Run migrations locally
npm run db:migrate

# View actual logs  
# (in src/main.ts with NODE_DEBUG=*)
NODE_DEBUG=net npm run start
```

---

## 🐛 Common Debug Scenarios

### ❌ "grep: unrecognized option: P"

**Cause:** Old docker-entrypoint.sh (before fix)  
**Fix:** Pull latest code
```bash
git pull origin main
git push  # Auto-redeploy
```
Then: Backend → Manual Deploy

### ❌ "Cannot find module '../../src/db/database'"

**Cause:** Old migrate.ts import path  
**Fix:** Pull latest code
```bash
git pull origin main
git push
```
Then: Backend → Manual Deploy

### ❌ Database connection timeout

**Cause:** PostgreSQL not ready or wrong URL  
**Steps:**
1. PostgreSQL panel → Check status is "Available"
2. Wait 5-10 minutes (databases start slowly)
3. Copy DATABASE_URL again exactly
4. Paste into Backend → Environment → DATABASE_URL
5. Backend → Manual Deploy

### ❌ "Build failed: cannot find package-lock.json"

**Cause:** Missing package-lock.json files  
**Fix:**
```bash
npm install
cd frontend && npm install && cd ..
git add package-lock.json frontend/package-lock.json
git commit -m "Add package-lock"
git push
```
Then: Backend/Frontend → Manual Deploy

### ❌ Frontend loads but shows "Cannot reach API"

**Cause:** Backend URL wrong  
**Check in Frontend environment:**
```
VITE_API_BASE_URL=https://pokemontcg-backend.onrender.com
```
Should exactly match Backend URL:
```
Dashboard → Backend Service → (top right) → Copy the URL
```

---

## 📋 Debug Checklist

```
🔍 Before calling our support:

Server Startup (TEST 1):
  ☑️ Backend service shows "Live" (green)
  ☑️ Logs contain "SERVER STARTED SUCCESSFULLY"
  ☑️ No errors before that message

Database Connection (TEST 2):
  ☑️ PostgreSQL shows "Available" (green)
  ☑️ DATABASE_URL copied exactly from Render PostgreSQL panel
  ☑️ Logs contain "Database connected"

Migrations (TEST 3):
  ☑️ Migrations run without errors
  ☑️ Logs contain "MIGRATION COMPLETED SUCCESSFULLY"
  ☑️ No "Cannot find module" errors

URLs:
  ☑️ Backend URL: https://pokemontcg-backend.onrender.com
  ☑️ Frontend URL: https://pokemontcg-frontend.onrender.com
  ☑️ Frontend has correct VITE_API_BASE_URL
```

---

## 🚀 Next Steps After Debugging

Once all tests pass (✅):

1. **Remove debug variables:**
   - Remove `SKIP_DATABASE=true` and `SKIP_MIGRATIONS=true` from all services
   - Keep only production variables

2. **Full deployment verification:**
   ```bash
   curl https://pokemontcg-backend.onrender.com/health
   # Should return: {"status":"ok"}
   
   curl https://pokemontcg-backend.onrender.com/admin/status/db
   # Should show database stats
   
   https://pokemontcg-frontend.onrender.com
   # Should load frontend without errors
   ```

3. **Monitor for 24 hours:**
   - Check Render Dashboard daily
   - View Metrics tab for errors
   - Keep logs accessible for troubleshooting

---

## 📞 Still Having Issues?

1. **Check Recent Changes:**
   ```bash
   git log --oneline -5
   ```
   Make sure latest commits are in repo

2. **Verify Latest Code:**
   ```bash
   git pull origin main
   git push  # Forces Render to rebuild
   ```

3. **Force Full Rebuild:**
   - Render Dashboard → Backend → Manual Deploy
   - Wait 5-10 minutes
   - Check Logs

4. **Escalate with Info:**
   - Screenshot of Logs tab
   - Output of `git log --oneline -5`
   - Values of environment variables (without passwords)
   - Relevant error messages from logs

---

**Last updated:** April 12, 2026  
**Status:** For debugging Render deployments only
