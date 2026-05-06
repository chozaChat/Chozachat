# Migration to PocketBase

## What Changed

**Before:** Frontend → Hono Server → Supabase  
**After:** Frontend → PocketBase (directly)

---

## Step 1: Install PocketBase SDK

```bash
bun install pocketbase
```

---

## Step 2: Create Collections in PocketBase

Follow `vps-deploy/POCKETBASE_COLLECTIONS.md` to create all 9 collections with proper fields, API rules, and indexes.

---

## Step 3: Clean Up VPS

On your VPS:
```bash
cd ~/chozachat
./cleanup-vps.sh
```

This removes all Hono server files and dependencies.

---

## Step 4: Update Your Code

I've created `src/lib/pocketbase.ts` with all the helper functions you need.

### Import the helpers:

```typescript
// Old
import { projectId, publicAnonKey } from "/utils/supabase/info";

// New
import { pb, login, register, getUser, sendMessage, etc } from '../lib/pocketbase';
```

### Example Migrations:

#### Login
```typescript
// Old
const response = await fetch(`https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/login`, {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

// New
const authData = await login(email, password);
const user = authData.record;
```

#### Get User
```typescript
// Old
const response = await fetch(`https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/user`, {
  headers: { 'X-User-Id': userId }
});
const data = await response.json();
const user = data.user;

// New
const user = await getUser(userId);
```

#### Send Message
```typescript
// Old
await fetch(`https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/messages`, {
  method: 'POST',
  body: JSON.stringify({ channelId, content }),
  headers: { 'X-User-Id': userId }
});

// New
await sendMessage(channelId, content);
```

#### List Messages
```typescript
// Old
const response = await fetch(`https://${projectId}.supabase.co/functions/v1/${SERVER_ID}/messages?channelId=${channelId}`);
const data = await response.json();
const messages = data.messages;

// New
const messages = await listMessages(channelId);
```

#### Realtime Messages
```typescript
// Old (Supabase Realtime)
const channel = supabase.channel(`room:${channelId}`);
channel.on('broadcast', { event: 'new-message' }, (payload) => {
  // Handle message
});

// New (PocketBase Realtime)
const unsubscribe = subscribeToMessages(channelId, (message) => {
  // Handle message
});

// Cleanup
unsubscribe();
```

---

## Step 5: Update Auth Flow

```typescript
// Login
const authData = await login(email, password);
localStorage.setItem('userId', authData.record.id);

// Check if logged in
const currentUser = pb.authStore.model;
if (currentUser) {
  // User is logged in
}

// Logout
pb.authStore.clear();
localStorage.removeItem('userId');
```

---

## Step 6: Admin Functions

```typescript
// Old
if (user.email === 'mikhail02323@gmail.com') {
  // Admin
}

// New
import { isAdmin, isModerator } from '../lib/pocketbase';

if (isAdmin()) {
  // Admin
}
```

---

## Key Differences

### 1. No More fetch() Calls
Use PocketBase SDK functions instead.

### 2. Auto Auth
PocketBase SDK handles auth tokens automatically - no need to pass `X-User-Id` headers.

### 3. Built-in Realtime
Use `pb.collection().subscribe()` instead of Supabase Realtime channels.

### 4. Simpler API
```typescript
// Instead of this:
const response = await fetch(url, { method, headers, body });
const data = await response.json();
if (!response.ok) throw new Error(data.error);

// Just this:
const data = await pb.collection('users').create(userData);
```

---

## Testing

1. Create collections in PocketBase
2. Run cleanup script on VPS
3. Install `pocketbase` npm package
4. Update imports to use `src/lib/pocketbase.ts`
5. Test login/register
6. Test sending messages
7. Test realtime updates

---

## Rollback Plan

If something breaks:
- Keep Supabase running as backup
- Switch `mode` back to 'supabase' in config
- Revert code changes

But with PocketBase, you get:
- ✅ No VPN needed
- ✅ Way faster (local DB)
- ✅ Lower latency
- ✅ Full control
- ✅ Uses way less RAM
