#!/bin/bash
# Cleanup unused files on VPS

echo "🧹 Cleaning up ChozaChat VPS..."

cd ~/chozachat

# Delete Hono server files (not needed with PocketBase)
echo "Removing Hono server files..."
rm -f index.tsx
rm -f kv_store.tsx
rm -f index-original.tsx
rm -f kv_store-supabase.tsx.bak
rm -f server.ts
rm -f fix.sh
rm -f fix-server.sh
rm -f create-files.sh
rm -f auto-setup.sh

# Delete Supabase-related files
echo "Removing Supabase files..."
rm -rf supabase/

# Delete old service files
echo "Removing old systemd services..."
sudo systemctl stop chozachat-api 2>/dev/null || true
sudo systemctl disable chozachat-api 2>/dev/null || true
sudo rm -f /etc/systemd/system/chozachat-api.service
sudo systemctl daemon-reload

# Delete PM2/ecosystem files
echo "Removing PM2 files..."
rm -f ecosystem.config.mjs
rm -f ecosystem.config.js

# Delete node_modules installed for Hono
echo "Removing Hono dependencies..."
rm -rf node_modules/hono
rm -rf node_modules/@hono

# Clean up any .env files with Supabase keys
echo "Removing old .env files..."
rm -f .env.old
rm -f .env.backup

# Keep these files:
# - pocketbase/ (your database)
# - pb_data/ (PocketBase data)
# - Caddyfile (your reverse proxy config)
# - node_modules/pocketbase (PocketBase SDK)

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Kept:"
echo "  - pocketbase/ (database)"
echo "  - pb_data/ (data)"
echo "  - Caddyfile"
echo "  - node_modules/pocketbase (SDK)"
echo ""
echo "You can now run PocketBase only:"
echo "  cd ~/chozachat/pocketbase"
echo "  ./pocketbase serve"
