# PocketBase Collections - Correct Setup

Open `https://api.chozachat.xyz/_/` and create these collections.

**Note:** Auth collections already have these system fields:
- id, created, updated, username, email, emailVisibility, verified (email verification)

---

## 1. users (Auth Collection)

Click "New Collection" → Select "Auth"

**Additional Fields to Add:**
- `name` - Plain text (click Add Field → Text)
- `emoji` - Plain text
- `tag` - Plain text
- `tagColor` - Plain text
- `customVerified` - Bool (this is for verified badge, NOT the system "verified" field)
- `passwordCompromised` - Bool
- `moderator` - Bool
- `coins` - Number, Min: 0, Default: 0
- `trialUsed` - Bool
- `subscription` - JSON
- `lastActive` - Date

**API Rules:**
- List/View: `@request.auth.id != ""`
- Create: ✅ (allow)
- Update: `@request.auth.id = id`
- Delete: `@request.auth.moderator = true`

**Options Tab:**
- Enable "Only verified" if you want email verification required

---

## 2. channels (Base Collection)

Click "New Collection" → Select "Base"

**Fields:**
- `name` - Text
- `username` - Text
- `emoji` - Text
- `type` - Text
- `verified` - Bool
- `members` - Relation → Collection: users, Multiple values: ✅
- `createdBy` - Relation → Collection: users, Single value

**API Rules:**
- List: `@request.auth.id != ""`
- View: `@request.auth.id != ""`
- Create: `@request.auth.id != ""`
- Update: `createdBy = @request.auth.id || @request.auth.moderator = true`
- Delete: `createdBy = @request.auth.id || @request.auth.moderator = true`

**Indexes (in Indexes tab):**
Click "New index":
- Create unique index on `username`

---

## 3. messages (Base Collection)

**Fields:**
- `content` - Text, Max: 2000
- `senderId` - Relation → users, Single
- `channelId` - Text
- `timestamp` - Date
- `edited` - Bool
- `type` - Text
- `pollData` - JSON
- `replyTo` - Text
- `reactions` - JSON
- `status` - Text

**API Rules:**
- List/View: `@request.auth.id != ""`
- Create: `@request.auth.id = senderId`
- Update: `senderId = @request.auth.id`
- Delete: `senderId = @request.auth.id || @request.auth.moderator = true`

**Indexes:**
- Index on `channelId`
- Index on `timestamp` (descending)

---

## 4. friendRequests (Base Collection)

**Fields:**
- `from` - Relation → users, Single
- `to` - Relation → users, Single
- `status` - Text

**API Rules:**
- List: `@request.auth.id = from || @request.auth.id = to`
- View: `@request.auth.id = from || @request.auth.id = to`
- Create: `@request.auth.id = from`
- Update: `@request.auth.id = to`
- Delete: `@request.auth.id = from || @request.auth.id = to`

**Indexes:**
- Index on `from`
- Index on `to`
- Index on `status`

---

## 5. kv_store (Base Collection)

**Fields:**
- `key` - Text
- `value` - JSON

**API Rules:** All ✅ (or lock down as needed)

**Indexes:**
- Unique index on `key`

---

## 6. settings (Base Collection)

**Fields:**
- `key` - Text
- `serverName` - Text
- `maxGroupMembers` - Number
- `allowRegistration` - Bool
- `geminiApiKey` - Text

**API Rules:**
- List/View: ✅
- Create/Update: `@request.auth.moderator = true`
- Delete: ❌ (uncheck all)

**Indexes:**
- Unique index on `key`

---

## 7. announcements (Base Collection)

**Fields:**
- `title` - Text
- `description` - Text (Long text)
- `buttonText` - Text
- `enabled` - Bool

**API Rules:**
- List/View: ✅
- Create/Update/Delete: `@request.auth.moderator = true`

---

## 8. customLanguages (Base Collection)

**Fields:**
- `key` - Text
- `displayName` - Text
- `translations` - JSON
- `createdBy` - Relation → users, Single

**API Rules:**
- List/View: ✅
- Create: `@request.auth.id != ""`
- Update/Delete: `createdBy = @request.auth.id`

**Indexes:**
- Unique index on `key`

---

## 9. stickers (Base Collection)

**Fields:**
- `name` - Text
- `pack` - Text
- `image` - File (Max files: 1, Max size: 5MB)
- `createdBy` - Relation → users, Single

**API Rules:**
- List/View: ✅
- Create: `@request.auth.id != ""`
- Update/Delete: `createdBy = @request.auth.id || @request.auth.moderator = true`

**Indexes:**
- Index on `pack`

---

## Important Notes:

1. **"verified" field confusion:**
   - System `verified` = email verification (auto)
   - Add `customVerified` (Bool) = verified badge ✓

2. **Required fields:**
   - PocketBase doesn't have a "required" checkbox in UI
   - Just don't set default values for fields you want required
   - Or use API rules to enforce

3. **Creating indexes:**
   - Go to collection → Indexes tab
   - Click "New index"
   - Check "Unique" if needed
   - Select field(s)

4. **API Rules syntax:**
   - `@request.auth.id` = current logged in user ID
   - `@request.auth.moderator` = checks moderator field
   - Use field names directly (no table prefix)

---

**Total: 9 collections**
