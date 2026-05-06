# Your Folder Structure

## After Setup

```
~/chozachat/              ← Your existing directory
├── pocketbase/           ← Already exists (your PocketBase files)
├── index.tsx             ← NEW: Your Hono API server
├── kv_store.tsx          ← NEW: Your database functions
├── chozachat-api.service ← NEW: Systemd service file (for auto-start)
├── node_modules/         ← Created by Bun after install
└── (your other files)    ← Cloudflare Tunnel config, etc.
```

## Just 2 Files to Add

You only need to copy these 2 files from your computer to VPS:

1. **`index.tsx`** - Your main API server (from `supabase/functions/server/index.tsx`)
2. **`kv_store.tsx`** - Your KV database functions (from `supabase/functions/server/kv_store.tsx`)

Everything else stays as-is!

## Caddy Config Location

Your Caddyfile is probably at one of these locations:
- `/etc/caddy/Caddyfile`
- `~/chozachat/Caddyfile`

To find it:
```bash
sudo systemctl status caddy
# Look for the config file path in the output
```

## Where Things Run

- **PocketBase**: Whatever port you configured (probably 8090?)
- **API Server**: Port 3000 (hardcoded in the server)
- **Caddy**: Routes external traffic to both
  - `api.chozachat.xyz` → `localhost:3000` (API)
  - Your other domains → PocketBase or other services

## Clean & Simple

Everything in one folder, no nested directories. Easy to manage!
