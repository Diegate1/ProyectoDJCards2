# 👨‍💻 NEW DEVELOPER? START HERE

Welcome to **ProyectoDJCards2**! 👋

This is a Pokémon TCG card database system with sync from multiple APIs in 3 languages.

---

## ⚡ 30-second quickstart

```bash
npm install
npm run db:up && npm run migrate
npm run dev                  # Terminal 1: Backend
cd frontend && npm run dev  # Terminal 2: Frontend
```

Then open **http://localhost:5173** in your browser 🎉

---

## 📚 Read These (in order)

### 5 minutes
👉 **[QUICKSTART.md](QUICKSTART.md)** - Fast setup guide

### 20 minutes (Recommended!)
👉 **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** - Complete project guide
- Project structure
- Where everything is
- How it works
- NPM scripts
- Common tasks
- Troubleshooting

### Reference docs
- **[SYNC_METHODS.md](SYNC_METHODS.md)** - How data syncs work
- **[README_ADMIN.md](README_ADMIN.md)** - Admin endpoints
- **[Render.md](Render.md)** - Production deployment

---

## 🗂️ Project Structure (Quick)

```
src/                Backend (Express + TypeScript)
frontend/           Frontend (React + Vite)
scripts/            Sync & utility scripts
docker-compose.yml  Local dev setup
```

👉 Full breakdown in [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)

---

## 🚀 Common Commands

```bash
npm run dev                 # Start backend
npm run sync:full           # Sync all data
npm run db:up               # Start database
npm run migrate             # Run migrations
npm run fix:refs            # Fix broken references
```

👉 More in [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md#-npm-scripts-reference)

---

## 🆘 Tips

**Can't connect to database?**
```bash
npm run db:up
npm run migrate
```

**Frontend won't load?**
```bash
# Make sure backend is running
curl http://localhost:3000/health
```

**Want to understand sync?**
👉 See [SYNC_METHODS.md](SYNC_METHODS.md)

👉 More troubleshooting in [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md#-debugging)

---

## 💡 What to explore

1. **Backend API:** `src/modules/data/data.controller.ts`
2. **Frontend pages:** `frontend/src/pages/`
3. **Sync logic:** `scripts/sync-tcgdex.ts`
4. **Database:** `src/db/database.ts`

---

## 📖 Full Documentation

See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for:
- Complete project diagram
- Architecture explained
- All API endpoints
- Database schema
- How to add features
- Debug techniques

---

**Ready? Open [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) 👉**

Questions? Check [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md#-getting-help)
