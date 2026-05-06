# PocketBase Collections for ChozaChat

Create these collections in PocketBase admin (`https://api.chozachat.xyz/_/`)

---

## Collection 1: users

**Type:** Auth collection

### Fields:
- `name` - Plain text, Required
- `username` - Plain text, Required, Min: 3, Max: 20
- `email` - Email, Required
- `emoji` - Plain text
- `tag` - Plain text
- `tagColor` - Plain text
- `verified` - Bool, Default: false
- `emailVerified` - Bool, Default: false
- `passwordCompromised` - Bool, Default: false
- `moderator` - Bool, Default: false
- `coins` - Number, Default: 0
- `trialUsed` - Bool, Default: false
- `subscription` - JSON
- `lastActive` - Date/Time
- `tags` - JSON

### API Rules:
- **List**: `@request.auth.id != ""`
- **View**: `@request.auth.id != ""`
- **Create**: Allow (for registration)
- **Update**: `@request.auth.id = id || @request.auth.moderator = true`
- **Delete**: `@request.auth.moderator = true`

### Indexes:
- `CREATE UNIQUE INDEX idx_username ON users (username)`
- `CREATE UNIQUE INDEX idx_email ON users (email)`
- `CREATE INDEX idx_lastActive ON users (lastActive)`

---

## Collection 2: channels

**Type:** Base collection

### Fields:
- `name` - Plain text, Required
- `username` - Plain text, Required, Min: 3, Max: 20
- `emoji` - Plain text
- `type` - Plain text, Required (values: "channel", "group", "dm")
- `verified` - Bool, Default: false
- `members` - Relation (to users), Multiple
- `createdBy` - Relation (to users), Single
- `createdAt` - Date/Time, Auto: created

### API Rules:
- **List**: `@request.auth.id != "" && (type = "channel" || members.id ?= @request.auth.id)`
- **View**: `@request.auth.id != "" && (type = "channel" || members.id ?= @request.auth.id)`
- **Create**: `@request.auth.id != ""`
- **Update**: `createdBy.id = @request.auth.id || @request.auth.moderator = true`
- **Delete**: `createdBy.id = @request.auth.id || @request.auth.moderator = true`

### Indexes:
- `CREATE UNIQUE INDEX idx_channel_username ON channels (username)`
- `CREATE INDEX idx_channel_type ON channels (type)`
- `CREATE INDEX idx_channel_members ON channels (members)`

---

## Collection 3: messages

**Type:** Base collection

### Fields:
- `content` - Plain text, Required, Max: 2000
- `senderId` - Relation (to users), Single, Required
- `channelId` - Plain text, Required
- `timestamp` - Date/Time, Required, Auto: created
- `edited` - Bool, Default: false
- `editedAt` - Date/Time
- `type` - Plain text, Default: "text" (values: "text", "poll", "command", "sticker")
- `pollData` - JSON
- `stickerData` - JSON
- `commandData` - JSON
- `replyTo` - Plain text (message ID)
- `reactions` - JSON
- `attachments` - JSON
- `status` - Plain text, Default: "sent" (values: "sent", "delivered", "read")

### API Rules:
- **List**: `@request.auth.id != ""`
- **View**: `@request.auth.id != ""`
- **Create**: `@request.auth.id = senderId.id`
- **Update**: `senderId.id = @request.auth.id`
- **Delete**: `senderId.id = @request.auth.id || @request.auth.moderator = true`

### Indexes:
- `CREATE INDEX idx_message_channel ON messages (channelId)`
- `CREATE INDEX idx_message_sender ON messages (senderId)`
- `CREATE INDEX idx_message_timestamp ON messages (timestamp DESC)`

---

## Collection 4: friendRequests

**Type:** Base collection

### Fields:
- `from` - Relation (to users), Single, Required
- `to` - Relation (to users), Single, Required
- `status` - Plain text, Required, Default: "pending" (values: "pending", "accepted", "rejected")
- `createdAt` - Date/Time, Required, Auto: created

### API Rules:
- **List**: `@request.auth.id = from.id || @request.auth.id = to.id`
- **View**: `@request.auth.id = from.id || @request.auth.id = to.id`
- **Create**: `@request.auth.id = from.id`
- **Update**: `@request.auth.id = to.id`
- **Delete**: `@request.auth.id = from.id || @request.auth.id = to.id`

### Indexes:
- `CREATE INDEX idx_friend_from ON friendRequests (from)`
- `CREATE INDEX idx_friend_to ON friendRequests (to)`
- `CREATE INDEX idx_friend_status ON friendRequests (status)`

---

## Collection 5: kv_store

**Type:** Base collection

### Fields:
- `key` - Plain text, Required
- `value` - JSON, Required

### API Rules:
- **List**: Allow all (or restrict as needed)
- **View**: Allow all
- **Create**: Allow all
- **Update**: Allow all
- **Delete**: Allow all

### Indexes:
- `CREATE UNIQUE INDEX idx_kv_key ON kv_store (key)`

---

## Collection 6: customLanguages

**Type:** Base collection

### Fields:
- `key` - Plain text, Required
- `displayName` - Plain text, Required
- `translations` - JSON, Required
- `createdBy` - Relation (to users), Single
- `createdAt` - Date/Time, Auto: created
- `shareLink` - Plain text

### API Rules:
- **List**: Allow all
- **View**: Allow all
- **Create**: `@request.auth.id != ""`
- **Update**: `createdBy.id = @request.auth.id`
- **Delete**: `createdBy.id = @request.auth.id`

### Indexes:
- `CREATE UNIQUE INDEX idx_lang_key ON customLanguages (key)`

---

## Collection 7: stickers

**Type:** Base collection

### Fields:
- `name` - Plain text, Required
- `pack` - Plain text, Required
- `image` - File (single), Required
- `createdBy` - Relation (to users), Single
- `createdAt` - Date/Time, Auto: created

### API Rules:
- **List**: Allow all
- **View**: Allow all
- **Create**: `@request.auth.id != ""`
- **Update**: `createdBy.id = @request.auth.id`
- **Delete**: `createdBy.id = @request.auth.id || @request.auth.moderator = true`

### Indexes:
- `CREATE INDEX idx_sticker_pack ON stickers (pack)`

---

## Collection 8: settings

**Type:** Base collection (Single document pattern)

### Fields:
- `key` - Plain text, Required (always "global")
- `serverName` - Plain text, Default: "ChozaChat"
- `maxGroupMembers` - Number, Default: 50
- `allowRegistration` - Bool, Default: true
- `messageRetentionDays` - Number, Default: 365
- `maxMessageLength` - Number, Default: 2000
- `enableFileUploads` - Bool, Default: false
- `requireEmailVerification` - Bool, Default: false
- `enableOnlineStatus` - Bool, Default: true
- `geminiApiKey` - Plain text
- `bestLanguageOfMonth` - Plain text

### API Rules:
- **List**: Allow all
- **View**: Allow all
- **Create**: `@request.auth.moderator = true`
- **Update**: `@request.auth.moderator = true`
- **Delete**: Deny

### Indexes:
- `CREATE UNIQUE INDEX idx_settings_key ON settings (key)`

---

## Collection 9: announcements

**Type:** Base collection

### Fields:
- `title` - Plain text, Required
- `description` - Plain text (Long text)
- `buttonText` - Plain text, Default: "Got it!"
- `enabled` - Bool, Default: false
- `createdAt` - Date/Time, Auto: created
- `createdBy` - Relation (to users), Single

### API Rules:
- **List**: `enabled = true || @request.auth.moderator = true`
- **View**: `enabled = true || @request.auth.moderator = true`
- **Create**: `@request.auth.moderator = true`
- **Update**: `@request.auth.moderator = true`
- **Delete**: `@request.auth.moderator = true`

### Indexes:
- `CREATE INDEX idx_announcement_enabled ON announcements (enabled)`

---

## Summary

9 collections total:
1. ✅ users (auth)
2. ✅ channels
3. ✅ messages
4. ✅ friendRequests
5. ✅ kv_store
6. ✅ customLanguages
7. ✅ stickers
8. ✅ settings
9. ✅ announcements

After creating these, your app will work directly with PocketBase!
