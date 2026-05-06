# Quick Fix for Deno → Bun Imports

Your files have Deno imports that don't work with Bun. Run these commands on your VPS:

## On Your VPS (in ~/chozachat folder):

```bash
cd ~/chozachat

# Fix index.tsx imports
sed -i 's|"npm:hono@4"|"hono"|g' index.tsx
sed -i "s|'npm:hono/cors'|'hono/cors'|g" index.tsx
sed -i 's|"jsr:@supabase/supabase-js@2"|"@supabase/supabase-js"|g' index.tsx

# Fix kv_store.tsx imports
sed -i 's|"jsr:@supabase/supabase-js@2.49.8"|"@supabase/supabase-js"|g' kv_store.tsx

# Replace Deno.env with process.env
sed -i 's|Deno.env.get|process.env|g' kv_store.tsx

# Install @supabase/supabase-js (needed for kv_store)
bun install @supabase/supabase-js

# Now try running again
bun run index.tsx
```

## What This Does

Changes:
- `"npm:hono@4"` → `"hono"`
- `'npm:hono/cors'` → `'hono/cors'`
- `"jsr:@supabase/supabase-js@2"` → `"@supabase/supabase-js"`
- `Deno.env.get(...)` → `process.env...`

These are just import syntax changes - the code stays the same!

## You'll Also Need Environment Variables

The kv_store needs these env vars. Add them before running:

```bash
export SUPABASE_URL="https://lsezogkntbhkmpvtcyjp.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"

# Then run
bun run index.tsx
```

Or better - create a `.env` file in ~/chozachat:
```bash
nano .env
```

Add:
```
SUPABASE_URL=https://lsezogkntbhkmpvtcyjp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
PORT=3000
```

Then Bun will auto-load it!
