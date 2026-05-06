# 👋 START HERE - ChozaChat PocketBase Setup

## What You're Doing

Moving from Supabase (requires VPN) to PocketBase (your own VPS, no VPN needed).

---

## 📋 Step 1: Create Collections (10 minutes)

Open: `https://api.chozachat.xyz/_/`

**Follow this guide:** `vps-deploy/QUICK_VISUAL_GUIDE.md`

**Or the detailed one:** `vps-deploy/POCKETBASE_CORRECT.md`

**Important notes:**
- Auth collection already has `verified` field (for email) - add `customVerified` for badges
- No "required" checkbox - just don't set defaults
- Create 9 collections total

---

## 🧹 Step 2: Clean Up VPS (30 seconds)

```bash
ssh root@api.chozachat.xyz
cd ~/chozachat
bash cleanup-simple.sh
```

This removes all the Hono server files you don't need.

---

## 💻 Step 3: Install & Test Frontend

```bash
# Install PocketBase SDK
bun install pocketbase

# Test locally
bun run dev
```

---

## ✅ What's Already Done

- ✅ All browser prompts removed (no more alert/confirm/prompt)
- ✅ Admin can add coins to themselves
- ✅ Proper dialogs for all actions
- ✅ PocketBase helpers ready in `src/lib/pocketbase.ts`
- ✅ VPS cleanup script ready

---

## 📁 Files to Read

**Pick ONE of these guides:**
1. `vps-deploy/QUICK_VISUAL_GUIDE.md` - Table format, easy to follow
2. `vps-deploy/POCKETBASE_CORRECT.md` - Detailed with explanations

**Then:**
3. `COMPLETE_SETUP.md` - Overview of everything

---

## 🎯 After Collections Are Created

You'll need to migrate your frontend code to use PocketBase SDK instead of fetch() calls.

**Example:**
```typescript
// Old
const response = await fetch(url, { headers: { 'X-User-Id': userId } });

// New
import { getUser } from '../lib/pocketbase';
const user = await getUser(userId);
```

I can help you migrate the code file by file!

---

## 🆘 Need Help?

Just ask! The collections are the most important part - once those are set up, everything else is straightforward.

**Start with:** `vps-deploy/QUICK_VISUAL_GUIDE.md` 🚀
