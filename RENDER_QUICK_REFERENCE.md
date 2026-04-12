# 🎯 RENDER QUICK REFERENCE

**Quick checklist + common issues**

---

## ⚡ 30-SECOND SUMMARY

1. **Database:** Create PostgreSQL → Copy `DATABASE_URL`
2. **Backend:** Create Web Service → Set `DATABASE_URL` + `VITE_API_BASE_URL`
3. **Frontend:** Create Web Service → Set `VITE_API_BASE_URL`
4. **Test:** `curl` health endpoints
5. **Done!** Open frontend URL in browser

---

## 📋 CREATE SERVICES CHECKLIST

### ☑️ PostgreSQL

```
Name:     pokemontcg-db
Database: pokemontcg
User:     postgres
Region:   N. Virginia
Plan:     Free
```

**After create** → Copy full DATABASE_URL

### ☑️ Backend Web Service

```
Name:           pokemontcg-backend
Repo:           ProyectoDJCards2
Branch:         main
Environment:    Docker
Dockerfile:     Dockerfile (root)

Variables:
  NODE_ENV              = production
  PORT                  = 3000
  DATABASE_URL          = (from PostgreSQL)
  LOG_LEVEL             = info
  FRONTEND_URL          = https://pokemontcg-frontend.onrender.com
  API_BASE_URL          = https://pokemontcg-backend.onrender.com
```

**After create** → Wait for "Live" → Copy URL

### ☑️ Frontend Web Service

```
Name:           pokemontcg-frontend
Repo:           ProyectoDJCards2
Branch:         main
Environment:    Docker
Dockerfile:     frontend/Dockerfile ⚠️

Variables:
  NODE_ENV              = production
  VITE_API_BASE_URL     = https://pokemontcg-backend.onrender.com
```

**After create** → Wait for "Live"

---

## ✅ VERIFICATION

```bash
# Test backend health
curl https://pokemontcg-backend.onrender.com/health
# Expected: {"status":"ok"}

# Test database connection
curl https://pokemontcg-backend.onrender.com/admin/status/db
# Expected: Connection OK

# Open frontend
https://pokemontcg-frontend.onrender.com
# Expected: Page loads, no blank screen
```

---

## ✅ FIXES ALREADY APPLIED

This repo includes critical fixes for Render deployments:

| ✅ Fix | Location | Details |
|--------|----------|---------|
| **Correct paths** | `scripts/migration/migrate.ts` | Import path fixed: `../../src/db/database` |
| **Alpine compatible** | `docker-entrypoint.sh` | Replaced `grep -P` with `sed` (BusyBox safe) |
| **Port binding** | `src/main.ts` | Listens on `0.0.0.0` for Render |
| **DB connection** | `docker-entrypoint.sh` | Using standard `pg_isready` command |
| **package-lock** | Root + frontend | Tracked for `npm ci` in Docker |

**If you see related errors → Pull latest version:**
```bash
git pull origin main
# Then: Dashboard → Manual Deploy
```

---

### Issue: Backend shows 503

```
❌ Problem:  Database connection failed
✅ Fix:      
   1. Verify DATABASE_URL in Backend environment
   2. Make sure PostgreSQL database status is "Available"
   3. Redeploy backend (Manual Deploy)
   4. Check logs (Dashboard → Logs tab)
```

### Issue: Frontend shows blank

```
❌ Problem:  Can't reach backend API
✅ Fix:
   1. Check VITE_API_BASE_URL is correct
   2. Verify backend is Live
   3. Check browser console (F12) for errors
   4. Redeploy frontend
```

### Issue: "Dockerfile not found"

```
❌ Problem:  Wrong path specified
✅ Fix:
   Backend:  Dockerfile (root directory)
   Frontend: frontend/Dockerfile
```

### Issue: Database won't accept connections

```
❌ Problem:  DATABASE_URL malformed or not ready
✅ Fix:
   1. Wait 3-5 minutes (Render databases take time)
   2. Copy DATABASE_URL from Render PostgreSQL panel again
   3. Paste full URL (with password) in Backend
   4. Redeploy backend
```

### Issue: Auto-deploy not working after git push

```
❌ Problem:  Webhook not connected or branch wrong
✅ Fix:
   1. Check branch is "main" (not "master")
   2. Dashboard → Settings → GitHub authorization
   3. Manual Deploy (Dashboard → service → Manual Deploy)
```

---

## 📊 SERVICE OVERVIEW

```
┌─────────────────────────────────────────┐
│         RENDER ARCHITECTURE             │
├─────────────────────────────────────────┤
│                                         │
│  CLIENT BROWSER                         │
│       ↓ (HTTPS)                         │
│   pokemontcg-frontend.onrender.com      │
│       ↓ API calls (/api/*)              │
│   pokemontcg-backend.onrender.com       │
│       ↓ SQL queries                     │
│   PostgreSQL (Managed)                  │
│                                         │
└─────────────────────────────────────────┘

Each service:
✓ Independiente
✓ Auto-scaling
✓ Auto-redeploy on push
✓ HTTPS by default
✓ Logs viewable in dashboard
```

---

## 🔑 ENVIRONMENT VARIABLES - COMPLETE LIST

### Backend (`pokemontcg-backend`)

```yaml
NODE_ENV:           production
PORT:               3000
DATABASE_URL:       postgresql://postgres:PASSWORD@dpg-xxxxx...
LOG_LEVEL:          info
FRONTEND_URL:       https://pokemontcg-frontend.onrender.com
API_BASE_URL:       https://pokemontcg-backend.onrender.com
```

### Frontend (`pokemontcg-frontend`)

```yaml
NODE_ENV:           production
VITE_API_BASE_URL:  https://pokemontcg-backend.onrender.com
```

### Database (Managed by Render)

```
No need to set - Render handles it
Generated DATABASE_URL will be provided
```

---

## 🚀 AFTER DEPLOYMENT

### URLs to bookmark

```
Frontend (UI):  https://pokemontcg-frontend.onrender.com
Admin/Debug:    https://pokemontcg-backend.onrender.com/admin/*
```

### Making updates

```
1. Make code changes locally
2. git commit && git push origin main
3. Wait 1-2 minutes
4. Visit Dashboard → Logs to verify deployment
5. Changes live!
```

### Monitoring

```
Dashboard → Select service → Logs
See real-time logs as they happen
Perfect for debugging issues
```

---

## ⚠️ IMPORTANT NOTES

1. **DATABASE_URL is sensitive** - Don't commit to GitHub
   - Render handles this securely via Environment Variables

2. **Free tier is great for testing**
   - Auto-sleeps after 15 minutes inactivity (on free)
   - If you see delays, it's just waking up

3. **Redeploy on every push**
   - Make sure auto-deploy is ON
   - Each commit to main triggers rebuild

4. **CORS might be enabled**
   - Backend should have CORS configured for frontend URL
   - See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) if issues

5. **Migrations run automatically**
   - `docker-entrypoint.sh` runs migrations on backend startup
   - Check logs to verify they ran

---

## 🔗 REFERENCE

| Need | Document |
|------|----------|
| **Step-by-step guide** | [renderConfig.md](renderConfig.md) (this is it!) |
| **Detailed setup** | [Render.md](Render.md) |
| **Project info** | [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) |
| **API endpoints** | [README_ADMIN.md](README_ADMIN.md) |
| **Data sync** | [SYNC_METHODS.md](SYNC_METHODS.md) |

---

## 🎯 TIMELINE

| Task | Time | Notes |
|------|------|-------|
| Create PostgreSQL | 2-3m | Just create, skip hard part |
| Backend setup | 5-10m | Wait for "Live" |
| Frontend setup | 5-10m | Wait for "Live" |
| Variables config | 2m | Copy-paste |
| Testing | 5m | curl + browser |
| **TOTAL** | **25-40m** | From zero to deployed! |

---

## ✅ SUCCESS INDICATORS

When deployed correctly, you should see:

- ✅ Backend responds: `curl https://pokemontcg-backend.onrender.com/health` → `{"status":"ok"}`
- ✅ Frontend loads: Browser shows login / main page
- ✅ Frontend can make API calls: Can see cards/sets data
- ✅ Database connected: No 503 errors
- ✅ Auto-deploys work: Push code → see changes live in 2 min

All 5? 🎉 **Deployment successful!**

---

**For detailed step-by-step:** See [renderConfig.md](renderConfig.md)

**Last updated:** April 12, 2026
