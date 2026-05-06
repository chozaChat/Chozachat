# ⚡ 5-Minute Quickstart

## What You're Doing
Moving your API from Supabase to your own VPS (api.chozachat.xyz)

---

## Step 1: VPS Setup (2 minutes)

**SSH into your VPS and run these commands:**

```bash
# Go to your existing chozachat folder
cd ~/chozachat

# Install Bun (skip if you have it)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# You'll copy files here in the next step
```

---

## Step 2: Copy Server Files (1 minute)

**Transfer these 2 files to your VPS:**

From your computer → To VPS:
- `supabase/functions/server/index.tsx` → `~/chozachat/index.tsx`  
- `supabase/functions/server/kv_store.tsx` → `~/chozachat/kv_store.tsx`

**How to copy (choose one):**

**Option A - Using SCP (from your computer):**
```bash
scp supabase/functions/server/index.tsx root@api.chozachat.xyz:~/chozachat/
scp supabase/functions/server/kv_store.tsx root@api.chozachat.xyz:~/chozachat/
```

**Option B - Manual copy/paste:**
- Open `index.tsx` on computer, copy content
- SSH to VPS: `nano ~/chozachat/index.tsx`, paste, save (Ctrl+O, Enter, Ctrl+X)
- Repeat for `kv_store.tsx`

**Then on VPS:**
```bash
cd ~/chozachat
bun install hono
bun run index.tsx
```

✅ Server should now be running! Keep this terminal open.

---

## Step 3: Update Caddy (30 seconds)

**Open another terminal/SSH session to your VPS:**

```bash
sudo nano /etc/caddy/Caddyfile
```

**Add to the end:**
```
api.chozachat.xyz {
    reverse_proxy localhost:3000
}
```

**Save and reload:**
```bash
sudo systemctl reload caddy
```

✅ Test: `curl https://api.chozachat.xyz/make-server-a1c86d03/health`

---

## Step 4: Update Frontend (1 minute)

**On your computer, edit: `src/config/api.ts`**

Change line 5 from:
```typescript
mode: 'supabase' as 'supabase' | 'vps',
```

To:
```typescript
mode: 'vps' as 'supabase' | 'vps',
```

**Then push to GitHub:**
```bash
git add src/config/api.ts
git commit -m "Switch to VPS API"
git push
```

✅ GitHub will auto-deploy to GitHub Pages!

---

## Step 5: Make It Auto-Start (Optional, 30 seconds)

**So the server starts automatically when VPS reboots:**

```bash
# On VPS
cd ~/chozachat
sudo cp chozachat-api.service /etc/systemd/system/

# Edit and replace YOUR_USERNAME with your actual username
sudo nano /etc/systemd/system/chozachat-api.service

# Enable it
sudo systemctl daemon-reload
sudo systemctl enable chozachat-api
sudo systemctl start chozachat-api
```

---

## 🎉 Done!

Your app is now running on your own VPS!

**Test it:**
- API health: https://api.chozachat.xyz/make-server-a1c86d03/health
- Your app: (your GitHub Pages URL)
- Figma preview: Just reload

**Useful commands:**
```bash
# View server logs
sudo journalctl -u chozachat-api -f

# Restart server
sudo systemctl restart chozachat-api

# Stop server
sudo systemctl stop chozachat-api
```

---

## If Something Breaks

**API not responding?**
```bash
sudo systemctl status chozachat-api
sudo journalctl -u chozachat-api -n 50
```

**Want to rollback?**
Change `mode: 'vps'` back to `mode: 'supabase'` in `src/config/api.ts` and push.

---

## What Changed?

**Before:**
Your app → Supabase Edge Functions → Database

**After:**
Your app → Your VPS (api.chozachat.xyz) → PocketBase

**Benefits:**
- ✅ No Supabase costs
- ✅ Full control
- ✅ Same features
- ✅ Works with your existing Caddy/Cloudflare setup
