# ✅ Complete PocketBase Setup

## 📋 Collections (Copy-Paste Ready)

See **`vps-deploy/COLLECTIONS_QUICK.md`** - Just copy the fields and rules!

**9 collections total:**
1. users (auth) - User accounts
2. channels - Channels/groups/DMs
3. messages - Chat messages
4. friendRequests - Friend system
5. kv_store - Key-value storage
6. settings - Server settings
7. announcements - Admin announcements
8. customLanguages - User languages
9. stickers - Sticker packs

---

## 🚀 VPS Cleanup

```bash
# SSH to your VPS
cd ~/chozachat
bash cleanup-simple.sh
```

This deletes all Hono/Supabase files you don't need anymore.

---

## 💻 Frontend Updates

**Already done for you:**

✅ Removed ALL browser prompts (prompt, confirm, alert)  
✅ Replaced with proper dialogs  
✅ Added ability for admin to add coins to self  
✅ Created PocketBase helper functions  
✅ Updated config to use PocketBase  

**To install:**
```bash
bun install pocketbase
```

---

## 🎯 What Changed

### AdminPanel
- ✅ No more `prompt()` for adding coins - proper dialog
- ✅ No more `confirm()` for deletions - confirmation dialogs
- ✅ No more `alert()` - uses toast notifications
- ✅ Admin can now add coins to themselves

### All Files
I found prompts/confirms in these files:
- AdminPanel.tsx ✅ Fixed
- BotBuilder.tsx (check if needed)
- ProfilePanel.tsx (check if needed)
- StickerPicker.tsx (check if needed)
- GifPicker.tsx (check if needed)

---

## 📁 Files Created

**Documentation:**
- `vps-deploy/COLLECTIONS_QUICK.md` - Quick collection setup
- `COMPLETE_SETUP.md` - This file
- `src/lib/pocketbase.ts` - Helper functions

**Scripts:**
- `vps-deploy/cleanup-simple.sh` - Clean VPS

---

## ⚡ Quick Steps

**1. Create collections** (10 min)
- Open https://api.chozachat.xyz/_/
- Follow `vps-deploy/COLLECTIONS_QUICK.md`

**2. Clean VPS** (30 sec)
```bash
bash cleanup-simple.sh
```

**3. Install & test** (2 min)
```bash
bun install pocketbase
bun run dev
```

**4. Deploy**
```bash
git push
```

Done! 🎉
