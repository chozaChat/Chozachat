# 👋 START HERE

## Your Situation
- ✅ You have a VPS with PocketBase, Cloudflare Tunnel, and Caddy
- ✅ Everything is in `~/chozachat/` directory
- ✅ You use Figma iFrame for preview
- ✅ You use GitHub Pages for deployment

## What You're Doing
Moving your API from Supabase to your VPS to save money.

---

## 📖 Read This First: `QUICKSTART.md`

**This is the only guide you need.**

It's a 5-minute, step-by-step guide that:
1. Adds 2 files to your existing `~/chozachat/` folder
2. Adds 3 lines to your Caddyfile  
3. Changes 1 word in your code
4. Pushes to GitHub

**Open:** `QUICKSTART.md`

---

## Other Files (Reference Only)

You don't need these, but they're here if you want them:

- **`README_SIMPLE.md`** - Detailed reference guide
- **`SIMPLE_DEPLOY.md`** - Alternative instructions
- **`chozachat-api.service`** - Auto-start config (optional)
- **`Caddyfile.example`** - Example Caddy config
- **`start-simple.sh`** - Helper script to run server

---

## Your Folder Structure

```
~/chozachat/          ← Your existing directory
├── pocketbase/       ← Already exists
├── index.tsx         ← Add this file
├── kv_store.tsx      ← Add this file
└── (other stuff)
```

---

## TL;DR Commands

**On VPS:**
```bash
cd ~/chozachat
# Copy index.tsx and kv_store.tsx here
bun run index.tsx
```

**Add to Caddyfile:**
```
api.chozachat.xyz {
    reverse_proxy localhost:3000
}
```

**In code, change:**
```typescript
mode: 'supabase' → mode: 'vps'
```

**Push to GitHub:**
```bash
git push
```

Done! 🎉

---

**Now go read:** `QUICKSTART.md`
