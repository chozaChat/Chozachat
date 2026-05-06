# Setup PocketBase KV Store

Since you already have PocketBase running, let's use it instead of Supabase!

## Step 1: Create the Collection in PocketBase

**Access your PocketBase admin:**
- Go to `http://YOUR_VPS_IP:8090/_/` (or however you access it)

**Create a new collection:**
1. Click "New Collection"
2. Name: `kv_store`
3. Type: Base collection
4. Add these fields:
   - **key** (Text, Required, Unique)
   - **value** (JSON, Required)

5. Click "Create"

## Step 2: Set Up API Rules

In the `kv_store` collection settings:
1. Go to "API Rules" tab
2. Set all rules (List, View, Create, Update, Delete) to allow access
   - You can lock this down later with proper auth

## Step 3: Install PocketBase SDK

On your VPS:

```bash
cd ~/chozachat
bun install pocketbase
```

## Step 4: Replace kv_store.tsx

**On your VPS:**

```bash
cd ~/chozachat

# Backup the old one
mv kv_store.tsx kv_store-supabase.tsx.bak

# Create the new PocketBase version
cat > kv_store.tsx << 'KVSEOF'
[PASTE THE CONTENT FROM kv_store-pocketbase.tsx HERE]
KVSEOF
```

## Step 5: Update .env

```bash
nano .env
```

Add (or update):
```
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_EMAIL=your_admin@email.com
POCKETBASE_ADMIN_PASSWORD=your_admin_password
PORT=3000
```

## Step 6: Fix index.tsx Imports

```bash
cd ~/chozachat

# Remove Supabase import (not needed anymore)
sed -i '/createClient.*supabase/d' index.tsx

# Fix Hono imports
sed -i 's|"npm:hono@4"|"hono"|g' index.tsx
sed -i "s|'npm:hono/cors'|'hono/cors'|g" index.tsx
```

## Step 7: Run It!

```bash
cd ~/chozachat
bun run index.tsx
```

**Now everything runs locally on your VPS - no VPN needed!** 🎉

## Benefits

✅ No Supabase dependency  
✅ No VPN needed  
✅ Everything on your VPS  
✅ Faster (local database)  
✅ Complete control  

## PocketBase Collection Schema

For reference, the collection should look like:

```
Collection: kv_store
├── key (Text, Required, Unique)
└── value (JSON, Required)
```

That's it! Your data is now stored in PocketBase on your VPS.
