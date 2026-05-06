# Visual PocketBase Setup Guide

## Creating Collections Step-by-Step

### 1. Users Collection

**Click:** New Collection → **Auth** (not Base!)

You'll see system fields already there:
- ✅ id, created, updated (auto)
- ✅ username, email, emailVisibility (auto)
- ✅ verified (this is for EMAIL verification, not badges!)

**Add these fields:**

| Field Name | Type | Settings |
|------------|------|----------|
| name | Text | - |
| emoji | Text | - |
| tag | Text | - |
| tagColor | Text | - |
| customVerified | Bool | Default: false (THIS is your verified badge ✓) |
| passwordCompromised | Bool | Default: false |
| moderator | Bool | Default: false |
| coins | Number | Min: 0, Default: 0 |
| trialUsed | Bool | Default: false |
| subscription | JSON | - |
| lastActive | Date | - |

**API Rules tab:**
```
List rule: @request.auth.id != ""
View rule: @request.auth.id != ""
Create rule: (leave checked ✅)
Update rule: @request.auth.id = id
Delete rule: @request.auth.moderator = true
```

---

### 2. Channels Collection

**Click:** New Collection → **Base**

| Field Name | Type | Settings |
|------------|------|----------|
| name | Text | - |
| username | Text | - |
| emoji | Text | - |
| type | Text | - |
| verified | Bool | Default: false |
| members | Relation | Collection: users, ✅ Multiple |
| createdBy | Relation | Collection: users, Single |

**API Rules:**
```
List: @request.auth.id != ""
View: @request.auth.id != ""
Create: @request.auth.id != ""
Update: createdBy = @request.auth.id || @request.auth.moderator = true
Delete: createdBy = @request.auth.id || @request.auth.moderator = true
```

**Indexes tab:**
- Click "New index"
- Select `username`
- Check ✅ Unique
- Save

---

### 3. Messages Collection

**Click:** New Collection → **Base**

| Field Name | Type | Settings |
|------------|------|----------|
| content | Text | Max: 2000 |
| senderId | Relation | Collection: users |
| channelId | Text | - |
| timestamp | Date | - |
| edited | Bool | Default: false |
| type | Text | - |
| pollData | JSON | - |
| replyTo | Text | - |
| reactions | JSON | - |
| status | Text | - |

**API Rules:**
```
List/View: @request.auth.id != ""
Create: @request.auth.id = senderId
Update: senderId = @request.auth.id
Delete: senderId = @request.auth.id || @request.auth.moderator = true
```

**Indexes:**
- Index on `channelId`
- Index on `timestamp`

---

### 4. friendRequests Collection

**Click:** New Collection → **Base**

| Field Name | Type | Settings |
|------------|------|----------|
| from | Relation | Collection: users |
| to | Relation | Collection: users |
| status | Text | - |

**API Rules:**
```
List: @request.auth.id = from || @request.auth.id = to
View: @request.auth.id = from || @request.auth.id = to
Create: @request.auth.id = from
Update: @request.auth.id = to
Delete: @request.auth.id = from || @request.auth.id = to
```

**Indexes:**
- Index on `from`
- Index on `to`

---

### 5. kv_store Collection

**Click:** New Collection → **Base**

| Field Name | Type | Settings |
|------------|------|----------|
| key | Text | - |
| value | JSON | - |

**API Rules:** All ✅ (check all boxes)

**Indexes:**
- Unique index on `key`

---

### 6. settings Collection

**Click:** New Collection → **Base**

| Field Name | Type | Settings |
|------------|------|----------|
| key | Text | - |
| serverName | Text | - |
| maxGroupMembers | Number | - |
| allowRegistration | Bool | - |
| geminiApiKey | Text | - |

**API Rules:**
```
List/View: ✅ (check)
Create/Update: @request.auth.moderator = true
Delete: ❌ (uncheck)
```

**Indexes:**
- Unique index on `key`

---

### 7-9. Quick Collections

**announcements:**
- title (Text)
- description (Text)
- buttonText (Text)
- enabled (Bool)

**customLanguages:**
- key (Text) - unique index
- displayName (Text)
- translations (JSON)
- createdBy (Relation → users)

**stickers:**
- name (Text)
- pack (Text)
- image (File)
- createdBy (Relation → users)

---

## Common Mistakes to Avoid:

❌ Don't add "verified" field to users - it's already there (for email)
✅ Add "customVerified" for your verified badge

❌ Don't look for "required" checkbox - it doesn't exist
✅ Just don't set defaults for required fields

❌ Don't use table prefixes in API rules
✅ Use field names directly: `createdBy = @request.auth.id`

---

## Quick Test:

After creating `users` collection:
1. Go to "Records" tab
2. Click "New record"
3. Fill in username, email, password
4. Save
5. Try logging in with PocketBase SDK

Done! 🎉
