# 🚀 Dead Simple Deployment Guide

## Your Current Setup
✅ VPS  
✅ PocketBase  
✅ Cloudflare Tunnel  
✅ Caddy  
✅ Figma iFrame for preview  
✅ GitHub Pages for hosting  

---

## 3 Steps to Deploy

### 📦 Step 1: Copy Server to VPS

**On your VPS:**
```bash
cd ~/chozachat
```

**Copy these 2 files from your computer to VPS:**
- `supabase/functions/server/index.tsx` → VPS: `~/chozachat/index.tsx`
- `supabase/functions/server/kv_store.tsx` → VPS: `~/chozachat/kv_store.tsx`

**Then run:**
```bash
chmod +x start-simple.sh
./start-simple.sh
```

Done! Server is running on port 3000.

---

### 🌐 Step 2: Update Caddy

**On your VPS, edit Caddyfile:**
```bash
sudo nano /etc/caddy/Caddyfile
```

**Add these 3 lines at the end:**
```
api.chozachat.xyz {
    reverse_proxy localhost:3000
}
```

**Save (Ctrl+O, Enter, Ctrl+X) and reload:**
```bash
sudo systemctl reload caddy
```

Done! API is now at https://api.chozachat.xyz

---

### 🎨 Step 3: Update Frontend & Push to GitHub

**In `src/config/api.ts`, change line 5:**
```typescript
mode: 'vps' as 'supabase' | 'vps',  // Change 'supabase' to 'vps'
```

**Then commit and push:**
```bash
git add .
git commit -m "Switch to VPS API"
git push
```

GitHub Actions will auto-deploy to GitHub Pages!

Done! Your app now uses the VPS API.

---

## Testing

1. **Test API:**
   ```bash
   curl https://api.chozachat.xyz/make-server-a1c86d03/health
   ```

2. **Test in Figma:** Just reload the preview

3. **Test on GitHub Pages:** Visit your site

---

## Keep It Running (Auto-start on VPS reboot)

**Copy the service file:**
```bash
# On VPS
sudo cp ~/chozachat/chozachat-api.service /etc/systemd/system/
```

**Edit it to add your username and correct path:**
```bash
sudo nano /etc/systemd/system/chozachat-api.service
# Change YOUR_USERNAME to your actual username (probably 'root' or 'ubuntu')
# Change WorkingDirectory to /home/YOUR_USERNAME/chozachat
```

**Enable it:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable chozachat-api
sudo systemctl start chozachat-api
```

**Check it's running:**
```bash
sudo systemctl status chozachat-api
```

---

## Troubleshooting

**Server not responding?**
```bash
# Check if it's running
sudo systemctl status chozachat-api

# See recent logs
sudo journalctl -u chozachat-api -n 50
```

**Caddy not working?**
```bash
# Test config
sudo caddy validate --config /etc/caddy/Caddyfile

# Restart Caddy
sudo systemctl restart caddy
```

**Frontend still using old API?**
- Clear browser cache
- Check `src/config/api.ts` has `mode: 'vps'`
- Check GitHub Actions ran successfully (go to Actions tab on GitHub)

---

## File Locations

**On VPS:**
- Server: `~/chozachat/`
- Your existing stuff: `~/chozachat/` (PocketBase, etc.)
- Logs: `sudo journalctl -u chozachat-api -f`
- Caddy config: `/etc/caddy/Caddyfile`

**On GitHub:**
- Frontend code: Push to main branch
- Auto-deploys via: `.github/workflows/deploy.yml`
- Published at: Your GitHub Pages URL

---

## Quick Commands

```bash
# Restart API
sudo systemctl restart chozachat-api

# View logs
sudo journalctl -u chozachat-api -f

# Reload Caddy (after config changes)
sudo systemctl reload caddy

# Deploy frontend (from your computer)
git push
```

---

That's it! No complex scripts, no PM2, no Nginx. Works with what you already have! 🎉
