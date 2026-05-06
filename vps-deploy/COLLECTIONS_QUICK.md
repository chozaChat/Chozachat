# PocketBase Collections - Quick Setup

Open `https://api.chozachat.xyz/_/` and create these:

---

## 1. users (Auth Collection)

**Fields:**
- name (Text, Required)
- username (Text, Required)
- email (Email, Required)
- emoji (Text)
- tag (Text)
- tagColor (Text)
- verified (Bool, default: false)
- emailVerified (Bool, default: false)
- passwordCompromised (Bool, default: false)
- moderator (Bool, default: false)
- coins (Number, default: 0)
- trialUsed (Bool, default: false)
- subscription (JSON)
- lastActive (DateTime)

**API Rules:**
- List: `@request.auth.id != ""`
- View: `@request.auth.id != ""`
- Create: ✅ (allow registration)
- Update: `@request.auth.id = id`
- Delete: `@request.auth.moderator = true`

**Indexes:**
- `idx_username` on `username` (UNIQUE)
- `idx_email` on `email` (UNIQUE)

---

## 2. channels (Base)

**Fields:**
- name (Text, Required)
- username (Text, Required)
- emoji (Text)
- type (Text, Required, default: "channel")
- verified (Bool, default: false)
- members (Relation to users, Multiple)
- createdBy (Relation to users, Single)

**API Rules:**
- List: `@request.auth.id != ""`
- View: `@request.auth.id != ""`
- Create: `@request.auth.id != ""`
- Update: `createdBy = @request.auth.id || @request.auth.moderator = true`
- Delete: `createdBy = @request.auth.id || @request.auth.moderator = true`

**Indexes:**
- `idx_channel_username` on `username` (UNIQUE)
- `idx_channel_type` on `type`

---

## 3. messages (Base)

**Fields:**
- content (Text, Required, max: 2000)
- senderId (Relation to users, Single, Required)
- channelId (Text, Required)
- timestamp (DateTime, Required)
- edited (Bool, default: false)
- type (Text, default: "text")
- pollData (JSON)
- replyTo (Text)
- reactions (JSON)
- status (Text, default: "sent")

**API Rules:**
- List: `@request.auth.id != ""`
- View: `@request.auth.id != ""`
- Create: `@request.auth.id = senderId`
- Update: `senderId = @request.auth.id`
- Delete: `senderId = @request.auth.id || @request.auth.moderator = true`

**Indexes:**
- `idx_msg_channel` on `channelId`
- `idx_msg_time` on `timestamp DESC`

---

## 4. friendRequests (Base)

**Fields:**
- from (Relation to users, Single, Required)
- to (Relation to users, Single, Required)
- status (Text, default: "pending")

**API Rules:**
- List: `@request.auth.id = from || @request.auth.id = to`
- View: `@request.auth.id = from || @request.auth.id = to`
- Create: `@request.auth.id = from`
- Update: `@request.auth.id = to`
- Delete: `@request.auth.id = from || @request.auth.id = to`

**Indexes:**
- `idx_friend_from` on `from`
- `idx_friend_to` on `to`

---

## 5. kv_store (Base)

**Fields:**
- key (Text, Required)
- value (JSON, Required)

**API Rules:** All ✅ (allow all)

**Indexes:**
- `idx_kv_key` on `key` (UNIQUE)

---

## 6. settings (Base)

**Fields:**
- key (Text, default: "global")
- serverName (Text)
- maxGroupMembers (Number, default: 50)
- allowRegistration (Bool, default: true)
- geminiApiKey (Text)

**API Rules:**
- List/View: ✅
- Create/Update: `@request.auth.moderator = true`
- Delete: ❌

**Indexes:**
- `idx_settings_key` on `key` (UNIQUE)

---

## 7. announcements (Base)

**Fields:**
- title (Text, Required)
- description (Text)
- buttonText (Text, default: "Got it!")
- enabled (Bool, default: false)

**API Rules:**
- List/View: ✅
- Create/Update/Delete: `@request.auth.moderator = true`

---

## 8. customLanguages (Base)

**Fields:**
- key (Text, Required)
- displayName (Text, Required)
- translations (JSON, Required)
- createdBy (Relation to users, Single)

**API Rules:**
- List/View: ✅
- Create: `@request.auth.id != ""`
- Update/Delete: `createdBy = @request.auth.id`

**Indexes:**
- `idx_lang_key` on `key` (UNIQUE)

---

## 9. stickers (Base)

**Fields:**
- name (Text, Required)
- pack (Text, Required)
- image (File, single)
- createdBy (Relation to users, Single)

**API Rules:**
- List/View: ✅
- Create: `@request.auth.id != ""`
- Update/Delete: `createdBy = @request.auth.id || @request.auth.moderator = true`

---

**That's it! 9 collections total.**
