# Simple VPS Deployment for Your Existing Setup

You already have: PocketBase, Cloudflare Tunnel, Caddy ✅

## Quick 3-Step Setup

### Step 1: Add Your Hono Server to VPS

On your VPS, create a new folder for the API:

```bash
# SSH into your VPS
cd ~
cd ~/chozachat
```

Copy just 2 files from `supabase/functions/server/`:
- `index.tsx` (your main server)
- `kv_store.tsx` (your database functions)

You can use git, scp, or just copy-paste the content.

### Step 2: Add Caddy Config

Your Caddy already runs, just add this to your Caddyfile:

```caddy
api.chozachat.xyz {
    reverse_proxy localhost:3000
}
```

Then reload Caddy:
```bash
sudo systemctl reload caddy
```

### Step 3: Run the Server

In the `~/chozachat` folder:

```bash
# Install Bun if you don't have it
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install hono

# Run the server (it will start on port 3000)
bun run index.tsx
```

That's it! Your API is now at `https://api.chozachat.xyz`

---

## Auto-Start on Boot (Optional)

To make it run automatically, create a systemd service:

```bash
sudo nano /etc/systemd/system/chozachat-api.service
```

Paste this (replace `YOUR_USERNAME` with your VPS username):

```ini
[Unit]
Description=ChozaChat API
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/chozachat
ExecStart=/home/YOUR_USERNAME/.bun/bin/bun run index.tsx
Restart=always
RestartSec=10
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable chozachat-api
sudo systemctl start chozachat-api
```

Check status:
```bash
sudo systemctl status chozachat-api
```

View logs:
```bash
sudo journalctl -u chozachat-api -f
```

---

## Update Your Frontend (GitHub Pages)

Since you publish to GitHub Pages, just update the code and push:

**Option A: Quick test (change one file)**

In your React components, replace:
```typescript
// Old
`https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/endpoint`

// New
`https://api.chozachat.xyz/make-server-a1c86d03/endpoint`
```

**Option B: Better way (use the config file I made)**

1. Use `src/config/api.ts` I created
2. Import it in your components:
   ```typescript
   import { apiRequest } from '../config/api';
   
   // Instead of fetch(), use:
   const response = await apiRequest('/user', {}, userId);
   ```
3. Change `mode: 'supabase'` to `mode: 'vps'` in `src/config/api.ts`
4. Push to GitHub

GitHub Pages will auto-rebuild and your app will use the VPS API.

---

## Testing

1. **Test API is running:**
   ```bash
   curl https://api.chozachat.xyz/make-server-a1c86d03/health
   ```
   
   Should return: `{"status":"ok",...}`

2. **Test in Figma iFrame:**
   Just reload the preview - it will use the new API

3. **If something breaks:**
   - Check server: `sudo systemctl status chozachat-api`
   - Check logs: `sudo journalctl -u chozachat-api -f`
   - Check Caddy: `sudo systemctl status caddy`

---

## What About PocketBase?

You're already using PocketBase! You can either:

1. **Keep current setup** - Just run both PocketBase and Hono side by side
   - PocketBase on one port (maybe 8090?)
   - Hono API on port 3000
   - Both behind Caddy

2. **Or migrate KV store to PocketBase** - Later when you're ready
   - Keep using Hono for the API logic
   - Replace the KV store functions to use PocketBase

Your choice! Current setup works fine.

---

## File Structure on VPS

```
~/ (your home)
└── chozachat/               (your existing directory)
    ├── pocketbase/          (already exists)
    ├── api/                 (new - add this)
    │   ├── index.tsx        (your Hono server)
    │   └── kv_store.tsx     (KV functions)
    └── Caddyfile            (already exists, just add api.chozachat.xyz)
```

---

## Common Issues

**"Bun not found"**
```bash
source ~/.bashrc
# or
export PATH="$HOME/.bun/bin:$PATH"
```

**"Port 3000 already in use"**
```bash
# Find what's using it
sudo lsof -i :3000
# Kill it or use a different port
```

**"API not accessible"**
- Check Cloudflare Tunnel is running
- Check Caddy config: `sudo caddy validate`
- Check firewall: `sudo ufw status`

---

## That's It!

No Nginx, no PM2, no complex scripts. Just:
1. Copy 2 files to VPS
2. Add 3 lines to Caddy
3. Run `bun run index.tsx`

Everything else you already have working! 🎉
