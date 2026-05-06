# Quick Reference Card

## VPS Commands

```bash
# Clean up old Hono files
cd ~/chozachat
bash cleanup-vps.sh

# Check PocketBase is running
ps aux | grep pocketbase

# Restart PocketBase (if needed)
cd ~/chozachat/pocketbase
./pocketbase serve

# View PocketBase logs
journalctl -u pocketbase -f
```

## Frontend Commands

```bash
# Install PocketBase SDK
bun install pocketbase

# Test locally
bun run dev

# Deploy to GitHub Pages
git add .
git commit -m "Update"
git push
```

## PocketBase Admin

- URL: `https://api.chozachat.xyz/_/`
- Create collections from: `vps-deploy/POCKETBASE_COLLECTIONS.md`

## Code Examples

### Import helpers:
```typescript
import { pb, login, getUser, sendMessage } from '../lib/pocketbase';
```

### Login:
```typescript
const auth = await login(email, password);
```

### Get user:
```typescript
const user = await getUser(userId);
```

### Send message:
```typescript
await sendMessage(channelId, content);
```

### List messages:
```typescript
const messages = await listMessages(channelId);
```

### Subscribe to realtime:
```typescript
const unsub = subscribeToMessages(channelId, (msg) => {
  console.log('New message:', msg);
});
// Later: unsub();
```

## Files to Read

1. **Start here:** `vps-deploy/SUMMARY.md`
2. **Collections:** `vps-deploy/POCKETBASE_COLLECTIONS.md`
3. **Migration:** `MIGRATION_TO_POCKETBASE.md`
4. **Helpers:** `src/lib/pocketbase.ts`
