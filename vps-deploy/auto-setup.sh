#!/bin/bash
# Auto-setup script for ChozaChat VPS
# This creates the correct index.tsx and kv_store.tsx with PocketBase

set -e

echo "🚀 ChozaChat VPS Auto-Setup"
echo "=============================="

cd ~/chozachat

# Clean up old files
echo "🧹 Cleaning up old files..."
rm -f index.tsx kv_store.tsx

# Create kv_store.tsx with PocketBase
echo "📦 Creating kv_store.tsx (PocketBase)..."
cat > kv_store.tsx << 'KVEOF'
/* PocketBase KV Store */
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090');

const initPB = async () => {
  if (!pb.authStore.isValid && process.env.POCKETBASE_ADMIN_EMAIL) {
    try {
      await pb.admins.authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL,
        process.env.POCKETBASE_ADMIN_PASSWORD || ''
      );
    } catch (e) {
      console.warn('PocketBase auth warning:', e);
    }
  }
  return pb;
};

const COLLECTION = 'kv_store';

export const set = async (key: string, value: any): Promise<void> => {
  const client = await initPB();
  try {
    const existing = await client.collection(COLLECTION).getFirstListItem(\`key="\${key}"\`).catch(() => null);
    if (existing) {
      await client.collection(COLLECTION).update(existing.id, { key, value });
    } else {
      await client.collection(COLLECTION).create({ key, value });
    }
  } catch (error: any) {
    throw new Error(\`KV Set error: \${error.message}\`);
  }
};

export const get = async (key: string): Promise<any> => {
  const client = await initPB();
  try {
    const record = await client.collection(COLLECTION).getFirstListItem(\`key="\${key}"\`);
    return record.value;
  } catch (error: any) {
    if (error.status === 404) return null;
    throw new Error(\`KV Get error: \${error.message}\`);
  }
};

export const del = async (key: string): Promise<void> => {
  const client = await initPB();
  try {
    const record = await client.collection(COLLECTION).getFirstListItem(\`key="\${key}"\`);
    await client.collection(COLLECTION).delete(record.id);
  } catch (error: any) {
    if (error.status !== 404) throw new Error(\`KV Delete error: \${error.message}\`);
  }
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  for (let i = 0; i < keys.length; i++) await set(keys[i], values[i]);
};

export const mget = async (keys: string[]): Promise<any[]> => {
  const results = [];
  for (const key of keys) results.push(await get(key));
  return results;
};

export const mdel = async (keys: string[]): Promise<void> => {
  for (const key of keys) await del(key);
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  const client = await initPB();
  try {
    const records = await client.collection(COLLECTION).getFullList({ filter: \`key ~ "\${prefix}"\` });
    return records.map(r => r.value);
  } catch (error: any) {
    throw new Error(\`KV GetByPrefix error: \${error.message}\`);
  }
};

export const getByPrefixWithKeys = async (prefix: string): Promise<Array<{key: string, value: any}>> => {
  const client = await initPB();
  try {
    const records = await client.collection(COLLECTION).getFullList({ filter: \`key ~ "\${prefix}"\` });
    return records.map(r => ({ key: r.key, value: r.value }));
  } catch (error: any) {
    throw new Error(\`KV GetByPrefixWithKeys error: \${error.message}\`);
  }
};
KVEOF

echo "✅ kv_store.tsx created!"

# Now download the original index.tsx and fix it
echo "📥 Downloading index.tsx from supabase/functions/server/..."

# This will need to be done manually or you need to scp the file
echo ""
echo "⚠️  MANUAL STEP NEEDED:"
echo "   You need to copy index.tsx from supabase/functions/server/"
echo "   Then run these commands to fix it:"
echo ""
echo "   sed -i 's|\"npm:hono@4\"|\"hono\"|g' index.tsx"
echo "   sed -i \"s|'npm:hono/cors'|'hono/cors'|g\" index.tsx"
echo "   sed -i '/createClient.*supabase/d' index.tsx"
echo "   sed -i '/jsr:@supabase/d' index.tsx"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
bun install pocketbase hono

echo ""
echo "✅ Setup almost complete!"
echo ""
echo "Next steps:"
echo "1. Copy index.tsx from your computer to ~/chozachat/"
echo "2. Run the sed commands above to fix imports"
echo "3. Create .env file with POCKETBASE settings"
echo "4. Create 'kv_store' collection in PocketBase admin"
echo "5. Run: bun run index.tsx"
echo ""
KVEOF

chmod +x auto-setup.sh

echo "✅ Auto-setup script created!"
echo ""
echo "Run it on your VPS:"
echo "  cd ~/chozachat"
echo "  ./auto-setup.sh"
