# Connect Frontend Directly to PocketBase

You're right - no need for the Hono server! PocketBase can handle everything.

## Step 1: Expose PocketBase via Caddy

Add this to your Caddyfile:

```
api.chozachat.xyz {
    reverse_proxy localhost:8090
}
```

Reload Caddy:
```bash
sudo systemctl reload caddy
```

## Step 2: Create Collections in PocketBase

Access PocketBase admin: `http://localhost:8090/_/` (or via Cloudflare Tunnel)

Create these collections:
- **users** - user accounts
- **messages** - chat messages  
- **channels** - channels/groups
- **kv_store** - key-value data (for settings, sessions, etc.)

### Fields for each:

**users:**
- name (Text)
- username (Text, Unique)
- email (Text, Unique)
- emoji (Text)
- tag (Text)
- tagColor (Text)
- verified (Bool)
- coins (Number)
- subscription (JSON)

**messages:**
- content (Text)
- senderId (Relation to users)
- channelId (Text)
- timestamp (Date)

**channels:**
- name (Text)
- username (Text, Unique)
- emoji (Text)
- type (Text)
- members (Relation to users, multiple)

**kv_store:**
- key (Text, Unique)
- value (JSON)

## Step 3: Update Frontend to Use PocketBase

Install PocketBase SDK:
```bash
bun install pocketbase
```

Update `src/config/api.ts`:
```typescript
import PocketBase from 'pocketbase';

export const pb = new PocketBase('https://api.chozachat.xyz');

// That's it! No more Hono server needed
```

## Step 4: Replace API Calls

Instead of `fetch()` calls to Hono endpoints, use PocketBase SDK:

```typescript
// Old (Hono/Supabase):
const response = await fetch(`${API_URL}/user`, {
  headers: { 'X-User-Id': userId }
});

// New (PocketBase):
const user = await pb.collection('users').getOne(userId);
```

## Benefits

✅ No server code to maintain  
✅ Built-in realtime subscriptions  
✅ Built-in auth  
✅ Admin UI for data management  
✅ Way less RAM usage  
✅ Simpler architecture  

## That's It!

PocketBase handles:
- REST API
- Realtime websockets
- Authentication
- File uploads
- Database

You literally don't need anything else! 🎉
