#!/bin/bash
# Simple cleanup script for ChozaChat VPS

echo "🧹 Cleaning up unused files..."

cd ~/chozachat || exit

# Delete all Hono/Supabase server files
rm -f index.tsx kv_store.tsx
rm -f index-original.tsx kv_store-supabase.tsx.bak
rm -f server.ts fix.sh fix-server.sh
rm -f create-files.sh auto-setup.sh
rm -f .env .env.old .env.backup

# Delete service files
sudo systemctl stop chozachat-api 2>/dev/null
sudo systemctl disable chozachat-api 2>/dev/null
sudo rm -f /etc/systemd/system/chozachat-api.service
sudo systemctl daemon-reload

# Delete PM2/ecosystem files
rm -f ecosystem.config.mjs ecosystem.config.js

# Clean node_modules (keep only pocketbase)
echo "Note: Keeping node_modules/pocketbase if it exists"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Kept files:"
echo "  - pocketbase/ (your database)"
echo "  - pb_data/ (PocketBase data)"
echo "  - Caddyfile"
echo ""
