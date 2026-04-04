import { Hono } from "npm:hono@4";
import { cors } from 'npm:hono/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// VERSION: 2024-04-01-v28-PROPERLY-SEPARATED-GROUPS-AND-CHANNELS

console.log('🚀🚀🚀 SERVER STARTING - VERSION: v28-PROPERLY-SEPARATED-GROUPS-AND-CHANNELS 🚀🚀🚀');

// Apply CORS middleware FIRST
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
}));

// Global request logger - logs EVERY request
app.use('*', async (c, next) => {
  console.log('🌐🌐🌐 [INCOMING REQUEST] ====================================');
  console.log('🌐 [REQUEST] Method:', c.req.method);
  console.log('🌐 [REQUEST] Path:', c.req.path);
  console.log('🌐 [REQUEST] URL:', c.req.url);
  console.log('🌐 [REQUEST] Raw URL:', c.req.raw.url);
  console.log('🌐 [REQUEST] Authorization:', c.req.header('Authorization') ? 'Present' : 'Missing');
  console.log('🌐 [REQUEST] X-User-Id:', c.req.header('X-User-Id'));
  console.log('🌐 [REQUEST] Content-Type:', c.req.header('Content-Type'));
  console.log('🌐 [REQUEST] All paths to check:');
  console.log('   - Exact path: "' + c.req.path + '"');
  console.log('   - Path includes /friends/request:', c.req.path.includes('/friends/request'));
  console.log('   - Path includes /friends/requests:', c.req.path.includes('/friends/requests'));
  console.log('   - Expected prefix: /' + SERVER_ID + '/');
  console.log('   - Path starts with prefix:', c.req.path.startsWith('/' + SERVER_ID + '/'));
  await next();
  console.log('🌐 [RESPONSE] Status:', c.res.status);
  console.log('🌐 [REQUEST END] ========================================');
});

// Global error handler
app.onError((err, c) => {
  console.error('❌ [GLOBAL ERROR]', err);
  console.error('❌ [GLOBAL ERROR] Stack:', err.stack);
  return c.json({ error: err.message || 'Internal server error' }, 500);
});

// Helper to get userId from Authorization header or fallback
function getUserIdFromRequest(c: any): string | null {
  const userIdHeader = c.req.header('X-User-Id');
  if (userIdHeader) {
    return userIdHeader;
  }
  return null;
}

async function validateSession(accessToken: string) {
  const sessionData = await kv.get(`session:${accessToken}`);
  if (sessionData?.userId) {
    return sessionData.userId;
  }
  
  return null;
}

// Retry helper for database operations
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const errorMessage = error?.message || String(error);
      
      const isRetryable = errorMessage.includes('Connection reset') || 
                          errorMessage.includes('ECONNRESET') ||
                          errorMessage.includes('network');
      
      if (isRetryable && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
}

// Health check endpoint
app.get("/make-server-a1c86d03/health", (c) => {
  return c.json({ status: "ok", version: "2024-04-01-v28-PROPERLY-SEPARATED-GROUPS-AND-CHANNELS", timestamp: new Date().toISOString() });
});

// Version check endpoint
app.get("/make-server-a1c86d03/version", (c) => {
  return c.json({ version: "2024-04-01-v28-PROPERLY-SEPARATED-GROUPS-AND-CHANNELS" });
});

const SERVER_ID = 'make-server-a1c86d03';

// Test endpoint
app.post(`/${SERVER_ID}/test`, async (c) => {
  console.log('[TEST] Test endpoint called');
  return c.json({ success: true, message: 'Test successful' });
});

// Signup endpoint
app.post(`/${SERVER_ID}/signup`, async (c) => {
  try {
    // Check if registration is allowed
    const settings = await kv.get('system:settings') || {};
    if (settings.allowRegistration === false) {
      return c.json({ error: 'New user registration is currently disabled' }, 403);
    }

    const body = await c.req.json();
    const { email, password, username, name, emoji } = body;

    // Username validation regex
    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(username)) {
      return c.json({ error: "Username can only contain English letters, numbers, underscores (_) and dots (.)" }, 400);
    }

    // Check if email or username already exists
    const allUsers = await kv.getByPrefix('user:');
    
    const emailExists = allUsers.some((u: any) => u.email === email);
    if (emailExists) {
      return c.json({ error: "Email already taken" }, 400);
    }

    const usernameExists = allUsers.some((u: any) => u.username === username);
    if (usernameExists) {
      return c.json({ error: "Username already taken" }, 400);
    }

    // Generate a unique user ID
    const userId = crypto.randomUUID();

    // Hash password (simple approach - in production you'd use bcrypt or similar)
    // For now, we'll store it as-is since this is a prototype
    // In production, NEVER store passwords in plain text!
    
    // Store user data in KV store
    const userData = {
      id: userId,
      email,
      username,
      name,
      emoji: emoji || '👤',
      password, // WARNING: In production, hash this!
      createdAt: new Date().toISOString(),
      tags: [],
      isScammer: false,
      isModerator: false
    };
    
    await kv.set(`user:${userId}`, userData);

    return c.json({ success: true, user: { ...userData, password: undefined } });
  } catch (error: any) {
    console.error('Signup error:', error);
    return c.json({ error: error.message || 'Signup failed' }, 500);
  }
});

// Login endpoint
app.post(`/${SERVER_ID}/login`, async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    console.log('🔐 [LOGIN] Attempting login for:', email);
    
    // Validate input
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Find user by email or username (case-insensitive)
    const allUsers = await kv.getByPrefix('user:');
    console.log('🔐 [LOGIN] Total users in database:', allUsers.length);
    
    // Filter out invalid users and add safety checks
    const validUsers = allUsers.filter((u: any) => u && (u.email || u.username));
    
    const user = validUsers.find((u: any) => 
      (u.email && email && u.email.toLowerCase() === email.toLowerCase()) || 
      (u.username && email && u.username.toLowerCase() === email.toLowerCase())
    );

    if (!user) {
      console.error('🔐 [LOGIN] User not found:', email);
      console.log('🔐 [LOGIN] Available emails:', allUsers.map((u: any) => u.email).join(', '));
      return c.json({ error: 'Invalid login credentials' }, 401);
    }

    console.log('🔐 [LOGIN] User found:', user.email);

    // Check password (in production, use bcrypt to compare hashed passwords!)
    if (user.password !== password) {
      console.error('🔐 [LOGIN] Password mismatch for user:', email);
      return c.json({ error: 'Invalid login credentials' }, 401);
    }

    console.log('🔐 [LOGIN] Password correct, generating session...');

    // Generate a session token
    const accessToken = crypto.randomUUID();

    // Store session in KV
    const sessionData = {
      userId: user.id,
      accessToken,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const sessionKey = `session:${accessToken}`;
    await kv.set(sessionKey, sessionData);

    return c.json({ success: true, accessToken, userId: user.id });
  } catch (error: any) {
    console.error('Login error:', error);
    return c.json({ error: error.message || 'Login failed' }, 500);
  }
});

// Logout endpoint
app.post(`/${SERVER_ID}/logout`, async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ success: true });
    }

    const token = authHeader.split(' ')[1];
    const sessionKey = `session:${token}`;
    
    await kv.del(sessionKey);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message || 'Logout failed' }, 500);
  }
});

// Verify session endpoint
app.get(`/${SERVER_ID}/verify-session`, async (c) => {
  try {
    const accessToken = c.req.header('x-access-token');
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    // Check if session exists in KV
    const sessionKey = `session:${accessToken}`;
    const session = await kv.get(sessionKey);
    
    if (!session) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    // Check if session has expired
    const expiresAt = new Date(session.expiresAt);
    if (expiresAt < new Date()) {
      await kv.del(sessionKey);
      return c.json({ error: 'Session expired' }, 401);
    }

    return c.json({ success: true, userId: session.userId });
  } catch (error: any) {
    console.error('Session verification error:', error);
    return c.json({ error: error.message || 'Session verification failed' }, 500);
  }
});

// Get current user
app.get(`/${SERVER_ID}/user`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const user = await kv.get(`user:${userId}`);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get user' }, 500);
  }
});

// Get user by ID
app.get(`/${SERVER_ID}/user/:id`, async (c) => {
  try {
    const targetUserId = c.req.param('id');
    
    const user = await kv.get(`user:${targetUserId}`);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get user' }, 500);
  }
});

// Lookup user by username
app.get(`/${SERVER_ID}/user/lookup`, async (c) => {
  try {
    const username = c.req.query('username');
    
    if (!username) {
      return c.json({ error: 'Username is required' }, 400);
    }

    const allUsers = await kv.getByPrefix('user:');
    const user = allUsers.find((u: any) => u.username === username);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ email: user.email, id: user.id });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to lookup user' }, 500);
  }
});

// Update user profile
app.put(`/${SERVER_ID}/user`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const body = await c.req.json();
    const { name, emoji, username, tag, tagColor } = body;

    const user = await kv.get(`user:${userId}`);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // If username is being changed, validate it
    if (username && username !== user.username) {
      const usernameRegex = /^[a-zA-Z0-9_.]+$/;
      if (!usernameRegex.test(username)) {
        return c.json({ error: "Username can only contain English letters, numbers, underscores (_) and dots (.)" }, 400);
      }

      // Check if new username already exists
      const allUsers = await kv.getByPrefix('user:');
      const usernameExists = allUsers.some((u: any) => u.username === username && u.id !== userId);
      if (usernameExists) {
        return c.json({ error: "Username already taken" }, 400);
      }
    }

    const updatedUser = {
      ...user,
      ...(name && { name }),
      ...(emoji && { emoji }),
      ...(username && { username }),
      ...(tag !== undefined && { tag }),
      ...(tagColor !== undefined && { tagColor })
    };

    await kv.set(`user:${userId}`, updatedUser);

    return c.json({ user: updatedUser });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to update user' }, 500);
  }
});

// Get all users
app.get(`/${SERVER_ID}/users`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const allUsers = await kv.getByPrefix('user:');
    
    return c.json({ users: allUsers });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get users' }, 500);
  }
});

// Get user by username (for invite links)
app.get(`/${SERVER_ID}/users/by-username/:username`, async (c) => {
  try {
    let username = decodeURIComponent(c.req.param('username'));
    console.log('Looking up username:', username);
    
    if (!username) {
      return c.json({ error: 'No username provided' }, 400);
    }

    // Remove @ symbol if present, since usernames are stored without it
    if (username.startsWith('@')) {
      username = username.substring(1);
    }

    const allUsers = await kv.getByPrefix('user:');
    console.log('All usernames in DB:', allUsers.map((u: any) => u.username));
    console.log('Searching for username (without @):', username);
    // Case-insensitive username lookup with safety checks
    const user = allUsers.find((u: any) => u && u.username && username && u.username.toLowerCase() === username.toLowerCase());
    
    if (!user) {
      console.log('User not found. Searched for:', username);
      const availableUsernames = allUsers.map((u: any) => u.username);
      return c.json({ 
        error: 'User not found', 
        searchedFor: username,
        availableUsernames: availableUsernames,
        totalUsers: allUsers.length
      }, 404);
    }

    // Return user without sensitive data
    return c.json({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      emoji: user.emoji,
      tag: user.tag,
      tagColor: user.tagColor,
      verified: user.verified,
      moderator: user.moderator
    });
  } catch (error: any) {
    console.error('Error getting user by username:', error);
    return c.json({ error: error.message || 'Failed to get user' }, 500);
  }
});

// Update user activity
app.post(`/${SERVER_ID}/user/activity`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const user = await withRetry(() => kv.get(`user:${userId}`));
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    user.lastActive = new Date().toISOString();
    await withRetry(() => kv.set(`user:${userId}`, user));

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to update activity' }, 500);
  }
});

// Send friend request
console.log(`✅ [ROUTE REGISTRATION] Registering POST /${SERVER_ID}/friends/request`);
app.post(`/${SERVER_ID}/friends/request`, async (c) => {
  console.log('🟦 [SERVER REQUEST] ===== ENDPOINT HIT =====');
  console.log('🟦 [SERVER REQUEST] Path:', c.req.path);
  console.log('🟦 [SERVER REQUEST] Method:', c.req.method);
  
  try {
    const userId = getUserIdFromRequest(c);
    console.log('🟦 [SERVER REQUEST] userId from request:', userId);
    
    if (!userId) {
      console.error('🟥 [SERVER REQUEST] No user ID provided');
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const body = await c.req.json();
    console.log('🟦 [SERVER REQUEST] Request body:', body);
    const { friendEmail } = body;

    if (!friendEmail) {
      console.error('🟥 [SERVER REQUEST] No friend email provided');
      return c.json({ error: 'Friend email is required' }, 400);
    }

    const allUsers = await kv.getByPrefix('user:');
    const friend = allUsers.find((u: any) => u.email === friendEmail);

    if (!friend) {
      console.error('🟥 [SERVER REQUEST] User not found:', friendEmail);
      return c.json({ error: 'User not found' }, 404);
    }

    if (friend.id === userId) {
      console.error('🟥 [SERVER REQUEST] Cannot add yourself');
      return c.json({ error: 'Cannot add yourself as a friend' }, 400);
    }

    const existingFriendship1 = await kv.get(`friendship:${userId}:${friend.id}`);
    const existingFriendship2 = await kv.get(`friendship:${friend.id}:${userId}`);
    const existingFriendship = existingFriendship1 || existingFriendship2;
    
    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        console.error('🟥 [SERVER REQUEST] Already friends');
        return c.json({ error: 'Already friends' }, 400);
      } else {
        console.error('🟥 [SERVER REQUEST] Request already pending');
        return c.json({ error: 'Friend request already pending' }, 400);
      }
    }

    const friendshipId = `friendship:${userId}:${friend.id}`;
    const friendshipData = {
      requesterId: userId,
      receiverId: friend.id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    await kv.set(friendshipId, friendshipData);
    console.log('🟩 [SERVER REQUEST] SUCCESS! Friend request created:', friendshipId);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[FRIEND REQUEST] ==> Error:', error);
    return c.json({ error: error.message || 'Failed to send friend request' }, 500);
  }
});

// Get pending friend requests
app.get(`/${SERVER_ID}/friends/requests`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const friendships = await withRetry(() => kv.getByPrefix('friendship:'));
    const pendingRequests: any[] = [];

    for (const f of friendships) {
      if (f.status === 'pending' && f.receiverId === userId) {
        const requester = await withRetry(() => kv.get(`user:${f.requesterId}`));
        if (requester) {
          pendingRequests.push({
            ...f,
            requester
          });
        }
      }
    }

    return c.json({ requests: pendingRequests });
  } catch (error: any) {
    return c.json({ error: 'Failed to get friend requests' }, 500);
  }
});

// Accept friend request
app.post(`/${SERVER_ID}/friends/accept`, async (c) => {
  console.log('🟦 [SERVER ACCEPT] ===== ENDPOINT HIT =====');
  console.log('🟦 [SERVER ACCEPT] Path:', c.req.path);
  console.log('🟦 [SERVER ACCEPT] Method:', c.req.method);
  
  try {
    const userId = getUserIdFromRequest(c);
    console.log('🟦 [SERVER ACCEPT] userId from request:', userId);
    
    if (!userId) {
      console.error('🟥 [SERVER ACCEPT] No user ID provided');
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const body = await c.req.json();
    console.log('🟦 [SERVER ACCEPT] Request body:', body);
    const { requesterId } = body;
    console.log('🟦 [SERVER ACCEPT] requesterId:', requesterId);

    const friendshipId = `friendship:${requesterId}:${userId}`;
    console.log('🟦 [SERVER ACCEPT] Looking for friendship:', friendshipId);
    
    const friendship = await kv.get(friendshipId);
    console.log('🟦 [SERVER ACCEPT] Found friendship:', friendship);

    if (!friendship || friendship.status !== 'pending') {
      console.error('🟥 [SERVER ACCEPT] Friend request not found or not pending');
      return c.json({ error: 'Friend request not found' }, 404);
    }

    friendship.status = 'accepted';
    friendship.acceptedAt = new Date().toISOString();
    await kv.set(friendshipId, friendship);
    console.log('🟩 [SERVER ACCEPT] SUCCESS! Friendship accepted');

    return c.json({ success: true });
  } catch (error: any) {
    console.error('���� [SERVER ACCEPT] EXCEPTION:', error);
    return c.json({ error: 'Failed to accept friend request' }, 500);
  }
});

// Reject friend request
app.post(`/${SERVER_ID}/friends/reject`, async (c) => {
  console.log('🟦 [SERVER REJECT] ===== ENDPOINT HIT =====');
  console.log('🟦 [SERVER REJECT] Path:', c.req.path);
  console.log('🟦 [SERVER REJECT] Method:', c.req.method);
  
  try {
    const userId = getUserIdFromRequest(c);
    console.log('🟦 [SERVER REJECT] userId from request:', userId);
    
    if (!userId) {
      console.error('🟥 [SERVER REJECT] No user ID provided');
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const body = await c.req.json();
    console.log('🟦 [SERVER REJECT] Request body:', body);
    const { requesterId } = body;
    console.log('🟦 [SERVER REJECT] requesterId:', requesterId);

    const friendshipId = `friendship:${requesterId}:${userId}`;
    console.log('🟦 [SERVER REJECT] Deleting friendship:', friendshipId);
    
    await kv.del(friendshipId);
    console.log('🟩 [SERVER REJECT] SUCCESS! Friendship rejected');

    return c.json({ success: true });
  } catch (error: any) {
    console.error('🟥 [SERVER REJECT] EXCEPTION:', error);
    return c.json({ error: 'Failed to reject friend request' }, 500);
  }
});

// Remove friend
app.post(`/${SERVER_ID}/friends/remove`, async (c) => {
  console.log('🟦 [SERVER REMOVE] ===== ENDPOINT HIT =====');
  console.log('🟦 [SERVER REMOVE] Path:', c.req.path);
  console.log('🟦 [SERVER REMOVE] Method:', c.req.method);
  
  try {
    const userId = getUserIdFromRequest(c);
    console.log('🟦 [SERVER REMOVE] userId from request:', userId);
    
    if (!userId) {
      console.error('🟥 [SERVER REMOVE] No user ID provided');
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const body = await c.req.json();
    console.log('🟦 [SERVER REMOVE] Request body:', body);
    const { friendId } = body;
    console.log('🟦 [SERVER REMOVE] friendId:', friendId);

    // Delete friendship in both directions
    const friendshipId1 = `friendship:${userId}:${friendId}`;
    const friendshipId2 = `friendship:${friendId}:${userId}`;
    console.log('🟦 [SERVER REMOVE] Deleting friendships:', friendshipId1, friendshipId2);
    
    await kv.del(friendshipId1);
    await kv.del(friendshipId2);
    console.log('🟩 [SERVER REMOVE] SUCCESS! Friend removed');

    return c.json({ success: true });
  } catch (error: any) {
    console.error('🟥 [SERVER REMOVE] EXCEPTION:', error);
    return c.json({ error: 'Failed to remove friend' }, 500);
  }
});

// Get friends list
app.get(`/${SERVER_ID}/friends`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const friendships = await kv.getByPrefix('friendship:');
    const friends: any[] = [];

    for (const f of friendships) {
      if (f.status === 'accepted') {
        if (f.requesterId === userId) {
          const friend = await kv.get(`user:${f.receiverId}`);
          if (friend) friends.push(friend);
        } else if (f.receiverId === userId) {
          const friend = await kv.get(`user:${f.requesterId}`);
          if (friend) friends.push(friend);
        }
      }
    }

    return c.json({ friends });
  } catch (error: any) {
    return c.json({ error: 'Failed to get friends' }, 500);
  }
});

// Get groups
app.get(`/${SERVER_ID}/groups`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const allGroups = await kv.getByPrefix('group:');
    const userGroups = allGroups.filter((g: any) => 
      g.members && g.members.includes(userId)
    );

    return c.json({ groups: userGroups });
  } catch (error: any) {
    return c.json({ error: 'Failed to get groups' }, 500);
  }
});

// Get channels (includes news channel)
app.get(`/${SERVER_ID}/channels`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const allGroupsAndChannels = await kv.getByPrefix('group:');
    
    // Filter to only user's groups and channels
    const userGroupsAndChannels = allGroupsAndChannels.filter((item: any) => 
      item.members && item.members.includes(userId)
    );
    
    // Ensure all items have a type property - use explicit type or default to 'group'
    const withTypes = userGroupsAndChannels.map((item: any) => ({
      ...item,
      type: item.type || 'group' // Default to 'group' if type is missing
    }));

    // Add news channel if user is authenticated
    const newsChannel = {
      id: 'news',
      name: 'News Channel',
      emoji: '📰',
      type: 'news',
      members: ['all']
    };

    console.log(`📊 [/channels] Returning ${withTypes.length} groups/channels plus news. Type breakdown:`, 
      withTypes.reduce((acc: any, item: any) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {}));

    return c.json({ channels: [newsChannel, ...withTypes] });
  } catch (error: any) {
    return c.json({ error: 'Failed to get channels' }, 500);
  }
});

// Get group by name (for invite links)
app.get(`/${SERVER_ID}/groups/by-name/:groupname`, async (c) => {
  try {
    const groupname = c.req.param('groupname');
    
    if (!groupname) {
      return c.json({ error: 'No group name provided' }, 400);
    }

    const allGroups = await kv.getByPrefix('group:');
    const group = allGroups.find((g: any) => 
      g.name === groupname && (!g.type || g.type === 'group')
    );
    
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    return c.json(group);
  } catch (error: any) {
    console.error('Error getting group by name:', error);
    return c.json({ error: error.message || 'Failed to get group' }, 500);
  }
});

// Get channel by name (for invite links)
app.get(`/${SERVER_ID}/channels/by-name/:channelname`, async (c) => {
  try {
    const channelname = c.req.param('channelname');
    
    if (!channelname) {
      return c.json({ error: 'No channel name provided' }, 400);
    }

    const allChannels = await kv.getByPrefix('group:');
    const channel = allChannels.find((ch: any) => 
      ch.name === channelname && ch.type === 'channel'
    );
    
    if (!channel) {
      return c.json({ error: 'Channel not found' }, 404);
    }

    return c.json(channel);
  } catch (error: any) {
    console.error('Error getting channel by name:', error);
    return c.json({ error: error.message || 'Failed to get channel' }, 500);
  }
});

// Get channel by username (for invite links like /c/username)
app.get(`/${SERVER_ID}/channels/by-username/:username`, async (c) => {
  try {
    let username = decodeURIComponent(c.req.param('username'));
    console.log('Looking up channel username:', username);
    
    if (!username) {
      return c.json({ error: 'No username provided' }, 400);
    }

    // Remove @ symbol if present, since usernames are stored without it
    if (username.startsWith('@')) {
      username = username.substring(1);
    }

    const allChannels = await kv.getByPrefix('group:');
    console.log('All channels in DB:', allChannels.filter((ch: any) => ch.type === 'channel').map((ch: any) => ({ name: ch.name, username: ch.username })));
    console.log('Searching for channel username (without @):', username);
    
    // Case-insensitive username lookup for channels only
    const channel = allChannels.find((ch: any) => 
      ch && ch.type === 'channel' && ch.username && username && ch.username.toLowerCase() === username.toLowerCase()
    );
    
    if (!channel) {
      console.log('Channel not found. Searched for:', username);
      const availableChannels = allChannels
        .filter((ch: any) => ch.type === 'channel' && ch.username)
        .map((ch: any) => ch.username);
      return c.json({ 
        error: 'Channel not found', 
        searchedFor: username,
        availableChannels: availableChannels,
        totalChannels: availableChannels.length
      }, 404);
    }

    return c.json(channel);
  } catch (error: any) {
    console.error('Error getting channel by username:', error);
    return c.json({ error: error.message || 'Failed to get channel' }, 500);
  }
});

// Search users
app.get(`/${SERVER_ID}/search`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const query = c.req.query('query') || '';
    
    if (!query) {
      return c.json({ users: [], channels: [] });
    }

    const allUsers = await kv.getByPrefix('user:');
    const searchLower = query?.toLowerCase() || '';
    
    const matchedUsers = allUsers.filter((u: any) => 
      u.id !== userId && (
        u.username?.toLowerCase().includes(searchLower) ||
        u.name?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower)
      )
    );

    const allGroups = await kv.getByPrefix('group:');
    const matchedChannels = allGroups.filter((g: any) =>
      g.name?.toLowerCase().includes(searchLower)
    );

    return c.json({ users: matchedUsers, channels: matchedChannels });
  } catch (error: any) {
    return c.json({ error: 'Failed to search' }, 500);
  }
});

// Get news
app.get(`/${SERVER_ID}/news`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const news = await kv.get('news') || [];

    return c.json({ messages: news });
  } catch (error: any) {
    return c.json({ error: 'Failed to get news' }, 500);
  }
});

// Post news (admin only)
app.post(`/${SERVER_ID}/news`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const body = await c.req.json();
    const { content } = body;

    const news = await kv.get('news') || [];
    
    const newsItem = {
      id: crypto.randomUUID(),
      senderId: userId,
      content,
      timestamp: new Date().toISOString()
    };

    news.push(newsItem);
    await kv.set('news', news);

    return c.json({ message: newsItem });
  } catch (error: any) {
    return c.json({ error: 'Failed to post news' }, 500);
  }
});

// Create group
app.post(`/${SERVER_ID}/groups`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const body = await c.req.json();
    const { name, emoji, memberIds } = body;

    // Start with creator as a member
    const members = [userId];
    
    // Add additional members if provided
    if (memberIds && Array.isArray(memberIds)) {
      memberIds.forEach((memberId: string) => {
        if (!members.includes(memberId)) {
          members.push(memberId);
        }
      });
    }

    const groupId = crypto.randomUUID();
    const groupData = {
      id: groupId,
      name,
      emoji: emoji || '👥',
      members,
      createdBy: userId,
      creatorId: userId,
      createdAt: new Date().toISOString(),
      type: 'group' // Mark this as a group to distinguish from channels
    };

    await kv.set(`group:${groupId}`, groupData);

    return c.json({ group: groupData });
  } catch (error: any) {
    return c.json({ error: 'Failed to create group' }, 500);
  }
});

// Create channel
app.post(`/${SERVER_ID}/channels`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const body = await c.req.json();
    const { name, username, emoji } = body;

    const channelId = crypto.randomUUID();
    const channelData = {
      id: channelId,
      name,
      username: username || '',
      emoji: emoji || '👥',
      members: [userId],
      admins: [userId], // Creator is always an admin
      creatorId: userId,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      type: 'channel' // Mark this as a channel to distinguish from groups
    };

    await kv.set(`group:${channelId}`, channelData);

    return c.json({ channel: channelData });
  } catch (error: any) {
    return c.json({ error: 'Failed to create channel' }, 500);
  }
});

// Get group details
app.get(`/${SERVER_ID}/groups/:id`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const groupId = c.req.param('id');
    const group = await kv.get(`group:${groupId}`);

    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    if (!group.members || !group.members.includes(userId)) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    return c.json({ group });
  } catch (error: any) {
    return c.json({ error: 'Failed to get group' }, 500);
  }
});

// Get channel details
app.get(`/${SERVER_ID}/channels/:id`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const channelId = c.req.param('id');
    
    // Handle news channel specially
    if (channelId === 'news') {
      return c.json({ 
        channel: {
          id: 'news',
          name: 'News Channel',
          emoji: '📰',
          type: 'news',
          members: ['all']
        }
      });
    }
    
    const channel = await kv.get(`group:${channelId}`);

    if (!channel) {
      return c.json({ error: 'Channel not found' }, 404);
    }

    if (!channel.members || !channel.members.includes(userId)) {
      return c.json({ error: 'Not a member of this channel' }, 403);
    }

    return c.json({ channel });
  } catch (error: any) {
    return c.json({ error: 'Failed to get channel' }, 500);
  }
});

// Update group
app.put(`/${SERVER_ID}/groups/:id`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const groupId = c.req.param('id');
    const body = await c.req.json();
    const { name, emoji } = body;

    const group = await kv.get(`group:${groupId}`);

    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    if (!group.members || !group.members.includes(userId)) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    const updatedGroup = {
      ...group,
      ...(name && { name }),
      ...(emoji && { emoji })
    };

    await kv.set(`group:${groupId}`, updatedGroup);

    return c.json({ group: updatedGroup });
  } catch (error: any) {
    return c.json({ error: 'Failed to update group' }, 500);
  }
});

// Update channel
app.put(`/${SERVER_ID}/channels/:id`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const channelId = c.req.param('id');
    const body = await c.req.json();
    const { name, emoji } = body;

    const channel = await kv.get(`group:${channelId}`);

    if (!channel) {
      return c.json({ error: 'Channel not found' }, 404);
    }

    if (!channel.members || !channel.members.includes(userId)) {
      return c.json({ error: 'Not a member of this channel' }, 403);
    }

    const updatedChannel = {
      ...channel,
      ...(name && { name }),
      ...(emoji && { emoji })
    };

    await kv.set(`group:${channelId}`, updatedChannel);

    return c.json({ channel: updatedChannel });
  } catch (error: any) {
    return c.json({ error: 'Failed to update channel' }, 500);
  }
});

// Manage channel admins (add/remove)
app.post(`/${SERVER_ID}/channels/:id/admins`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const channelId = c.req.param('id');
    const body = await c.req.json();
    const { memberId, action } = body; // action: 'add' or 'remove'

    const channel = await kv.get(`group:${channelId}`);

    if (!channel) {
      return c.json({ error: 'Channel not found' }, 404);
    }

    // Only the creator can manage admins
    if (channel.creatorId !== userId) {
      return c.json({ error: 'Only the channel creator can manage admins' }, 403);
    }

    // Check if member exists in channel
    if (!channel.members || !channel.members.includes(memberId)) {
      return c.json({ error: 'User is not a member of this channel' }, 400);
    }

    // Initialize admins array if it doesn't exist
    if (!channel.admins) {
      channel.admins = [channel.creatorId];
    }

    if (action === 'add') {
      if (!channel.admins.includes(memberId)) {
        channel.admins.push(memberId);
      }
    } else if (action === 'remove') {
      // Cannot remove the creator from admins
      if (memberId === channel.creatorId) {
        return c.json({ error: 'Cannot remove creator from admins' }, 400);
      }
      channel.admins = channel.admins.filter((id: string) => id !== memberId);
    } else {
      return c.json({ error: 'Invalid action. Use "add" or "remove"' }, 400);
    }

    await kv.set(`group:${channelId}`, channel);

    return c.json({ channel });
  } catch (error: any) {
    return c.json({ error: 'Failed to manage channel admins' }, 500);
  }
});

// Delete group
app.delete(`/${SERVER_ID}/groups/:id`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const groupId = c.req.param('id');
    const group = await kv.get(`group:${groupId}`);

    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    // Only creator can delete
    if (group.createdBy !== userId) {
      return c.json({ error: 'Only the creator can delete this group' }, 403);
    }

    await kv.del(`group:${groupId}`);
    
    // Also delete messages
    await kv.del(`messages:group:${groupId}`);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to delete group' }, 500);
  }
});

// Delete channel
app.delete(`/${SERVER_ID}/channels/:id`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const channelId = c.req.param('id');
    const channel = await kv.get(`group:${channelId}`);

    if (!channel) {
      return c.json({ error: 'Channel not found' }, 404);
    }

    // Only creator can delete
    if (channel.createdBy !== userId) {
      return c.json({ error: 'Only the creator can delete this channel' }, 403);
    }

    await kv.del(`group:${channelId}`);
    
    // Also delete messages (use correct type)
    await kv.del(`messages:channel:${channelId}`);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to delete channel' }, 500);
  }
});

// Add member to group
app.post(`/${SERVER_ID}/groups/:id/members`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const groupId = c.req.param('id');
    const body = await c.req.json();
    const { memberId } = body;

    const group = await kv.get(`group:${groupId}`);

    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    if (!group.members || !group.members.includes(userId)) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    if (group.members.includes(memberId)) {
      return c.json({ error: 'User already in group' }, 400);
    }

    group.members.push(memberId);
    await kv.set(`group:${groupId}`, group);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to add member' }, 500);
  }
});

// Add member to channel
app.post(`/${SERVER_ID}/channels/:id/members`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const channelId = c.req.param('id');
    const body = await c.req.json();
    const { memberId } = body;

    const channel = await kv.get(`group:${channelId}`);

    if (!channel) {
      return c.json({ error: 'Channel not found' }, 404);
    }

    if (!channel.members || !channel.members.includes(userId)) {
      return c.json({ error: 'Not a member of this channel' }, 403);
    }

    if (channel.members.includes(memberId)) {
      return c.json({ error: 'User already in channel' }, 400);
    }

    channel.members.push(memberId);
    await kv.set(`group:${channelId}`, channel);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to add member' }, 500);
  }
});

// Join channel
app.post(`/${SERVER_ID}/channels/:id/join`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const channelId = c.req.param('id');
    const channel = await kv.get(`group:${channelId}`);

    if (!channel) {
      return c.json({ error: 'Channel not found' }, 404);
    }

    if (channel.members && channel.members.includes(userId)) {
      return c.json({ error: 'Already a member of this channel' }, 400);
    }

    if (!channel.members) {
      channel.members = [];
    }
    
    channel.members.push(userId);
    await kv.set(`group:${channelId}`, channel);

    return c.json({ success: true, channel });
  } catch (error: any) {
    return c.json({ error: 'Failed to join channel' }, 500);
  }
});

// Leave channel
app.post(`/${SERVER_ID}/channels/:id/leave`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const channelId = c.req.param('id');
    const channel = await kv.get(`group:${channelId}`);

    if (!channel) {
      return c.json({ error: 'Channel not found' }, 404);
    }

    if (!channel.members || !channel.members.includes(userId)) {
      return c.json({ error: 'Not a member of this channel' }, 400);
    }

    // Remove user from members
    channel.members = channel.members.filter((m: string) => m !== userId);
    
    // If no members left, delete the channel
    if (channel.members.length === 0) {
      await kv.del(`group:${channelId}`);
      await kv.del(`messages:channel:${channelId}`);
    } else {
      await kv.set(`group:${channelId}`, channel);
    }

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to leave channel' }, 500);
  }
});

// Remove member from group
app.delete(`/${SERVER_ID}/groups/:id/members/:memberId`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const groupId = c.req.param('id');
    const memberId = c.req.param('memberId');

    const group = await kv.get(`group:${groupId}`);

    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    if (!group.members || !group.members.includes(userId)) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    group.members = group.members.filter((m: string) => m !== memberId);
    await kv.set(`group:${groupId}`, group);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to remove member' }, 500);
  }
});

// Remove member from channel
app.delete(`/${SERVER_ID}/channels/:id/members/:memberId`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const channelId = c.req.param('id');
    const memberId = c.req.param('memberId');

    const channel = await kv.get(`group:${channelId}`);

    if (!channel) {
      return c.json({ error: 'Channel not found' }, 404);
    }

    if (!channel.members || !channel.members.includes(userId)) {
      return c.json({ error: 'Not a member of this channel' }, 403);
    }

    channel.members = channel.members.filter((m: string) => m !== memberId);
    await kv.set(`group:${channelId}`, channel);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to remove member' }, 500);
  }
});

// Get messages
app.get(`/${SERVER_ID}/messages`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const chatId = c.req.query('chatId');
    const chatType = c.req.query('chatType');

    if (!chatId || !chatType) {
      return c.json({ error: 'chatId and chatType are required' }, 400);
    }

    const messageKey = `messages:${chatType}:${chatId}`;
    const messages = await kv.get(messageKey) || [];

    return c.json({ messages });
  } catch (error: any) {
    return c.json({ error: 'Failed to get messages' }, 500);
  }
});

// Get messages by chat ID (path parameter version)
app.get(`/${SERVER_ID}/messages/:chatId`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const chatId = c.req.param('chatId');
    
    console.log(`🔍 [GET /messages/${chatId}] Loading messages for chatId: ${chatId}`);
    
    // Check if it's news
    if (chatId === 'news' || chatId === 'news-channel') {
      const news = await kv.get('news') || [];
      console.log(`✅ [GET /messages/${chatId}] Returning ${news.length} news messages`);
      return c.json({ messages: news });
    }
    
    // Try to determine chat type based on chatId
    let chatType = 'friend';
    
    // Check if it's a group or channel by fetching the item
    const item = await kv.get(`group:${chatId}`);
    if (item && item.type) {
      // Use the item's type property (could be 'group' or 'channel')
      chatType = item.type;
      console.log(`🔍 [GET /messages/${chatId}] Found item with type: ${chatType}`);
    } else if (item) {
      // If item exists but no type, default to 'group' for backward compatibility
      chatType = 'group';
      console.log(`⚠️ [GET /messages/${chatId}] Found item but no type property, defaulting to 'group'`);
    } else {
      console.log(`🔍 [GET /messages/${chatId}] No group/channel found, assuming friend chat`);
    }

    const messageKey = `messages:${chatType}:${chatId}`;
    const messages = await kv.get(messageKey) || [];
    
    console.log(`✅ [GET /messages/${chatId}] Returning ${messages.length} messages from key: ${messageKey}`);

    return c.json({ messages });
  } catch (error: any) {
    return c.json({ error: 'Failed to get messages' }, 500);
  }
});

// Send message
app.post(`/${SERVER_ID}/messages`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const body = await c.req.json();
    const { chatId, chatType, content } = body;

    if (!chatId || !chatType || !content) {
      return c.json({ error: 'chatId, chatType, and content are required' }, 400);
    }

    // For channels, check if user has permission to post
    if (chatType === 'channel') {
      const channel = await kv.get(`group:${chatId}`);
      if (channel && channel.type === 'channel') {
        // Only creator and admins can post in channels
        const isCreator = channel.creatorId === userId;
        const isAdmin = channel.admins && channel.admins.includes(userId);
        
        if (!isCreator && !isAdmin) {
          return c.json({ error: 'Only channel admins can post messages' }, 403);
        }
      }
    }

    const messageKey = `messages:${chatType}:${chatId}`;
    const messages = await kv.get(messageKey) || [];

    const message = {
      id: crypto.randomUUID(),
      senderId: userId,
      content,
      timestamp: new Date().toISOString()
    };

    messages.push(message);
    await kv.set(messageKey, messages);

    return c.json({ message });
  } catch (error: any) {
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Get server statistics
app.get(`/${SERVER_ID}/stats`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const allUsers = await kv.getByPrefix('user:');
    const totalUsers = allUsers.length;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const onlineUsers = allUsers.filter((user: any) => {
      if (!user.lastActive) return false;
      return user.lastActive > fiveMinutesAgo;
    }).length;

    return c.json({ 
      totalUsers,
      onlineUsers
    });
  } catch (error: any) {
    return c.json({ error: 'Failed to get stats' }, 500);
  }
});

// Admin: Get all users
app.get(`/${SERVER_ID}/admin/users`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || (currentUser.email !== 'mikhail02323@gmail.com' && !currentUser.isModerator)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const allUsers = await kv.getByPrefix('user:');
    
    return c.json({ users: allUsers });
  } catch (error: any) {
    return c.json({ error: 'Failed to get users' }, 500);
  }
});

// Admin: Get all channels
app.get(`/${SERVER_ID}/admin/channels`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const allGroupsAndChannels = await kv.getByPrefix('group:');
    const channels = allGroupsAndChannels.filter((item: any) => item.type === 'channel');
    
    return c.json({ channels });
  } catch (error: any) {
    return c.json({ error: 'Failed to get channels' }, 500);
  }
});

// Admin: Toggle channel verification
app.post(`/${SERVER_ID}/admin/channels/:id/verify`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const channelId = c.req.param('id');
    const channel = await kv.get(`group:${channelId}`);

    if (!channel) {
      return c.json({ error: 'Channel not found' }, 404);
    }

    if (channel.type !== 'channel') {
      return c.json({ error: 'Not a channel' }, 400);
    }

    // Toggle verification
    channel.verified = !channel.verified;
    await kv.set(`group:${channelId}`, channel);

    return c.json({ channel });
  } catch (error: any) {
    return c.json({ error: 'Failed to toggle channel verification' }, 500);
  }
});

// Admin: Delete channel
app.delete(`/${SERVER_ID}/admin/channels/:id`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const channelId = c.req.param('id');
    const channel = await kv.get(`group:${channelId}`);

    if (!channel) {
      return c.json({ error: 'Channel not found' }, 404);
    }

    // Admin can delete any channel
    await kv.del(`group:${channelId}`);
    
    // Also delete messages
    await kv.del(`messages:channel:${channelId}`);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to delete channel' }, 500);
  }
});

// Admin: Update user
app.put(`/${SERVER_ID}/admin/users/:id`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || (currentUser.email !== 'mikhail02323@gmail.com' && !currentUser.isModerator)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const targetUserId = c.req.param('id');
    const body = await c.req.json();

    const targetUser = await kv.get(`user:${targetUserId}`);
    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Moderators can only mark passwords and scammers
    if (currentUser.isModerator && currentUser.email !== 'mikhail02323@gmail.com') {
      const allowedFields = ['passwordCompromised', 'isScammer'];
      const requestedFields = Object.keys(body);
      const unauthorized = requestedFields.some(f => !allowedFields.includes(f));
      
      if (unauthorized) {
        return c.json({ error: 'Moderators can only update password and scammer status' }, 403);
      }
    }

    const updatedUser = {
      ...targetUser,
      ...body
    };

    // If promoting to moderator, add MOD tag automatically
    if (body.isModerator && !targetUser.isModerator) {
      if (!updatedUser.tags) updatedUser.tags = [];
      if (!updatedUser.tags.includes('MOD')) {
        updatedUser.tags.push('MOD');
      }
    }

    // If demoting from moderator, remove MOD tag
    if (body.isModerator === false && targetUser.isModerator) {
      if (updatedUser.tags) {
        updatedUser.tags = updatedUser.tags.filter((t: string) => t !== 'MOD');
      }
    }

    await kv.set(`user:${targetUserId}`, updatedUser);

    return c.json({ user: updatedUser });
  } catch (error: any) {
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// Admin: Get news
app.get(`/${SERVER_ID}/admin/news`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const news = await kv.get('news') || [];

    return c.json({ news });
  } catch (error: any) {
    return c.json({ error: 'Failed to get news' }, 500);
  }
});

// Admin: Post news
app.post(`/${SERVER_ID}/admin/news`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const body = await c.req.json();
    const { content } = body;

    const news = await kv.get('news') || [];
    
    const newsItem = {
      id: crypto.randomUUID(),
      content,
      createdAt: new Date().toISOString(),
      authorId: userId
    };

    news.unshift(newsItem);
    await kv.set('news', news);

    return c.json({ news: newsItem });
  } catch (error: any) {
    return c.json({ error: 'Failed to post news' }, 500);
  }
});

// Admin: Get all channels
app.get(`/${SERVER_ID}/admin/channels`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const allGroups = await kv.getByPrefix('group:');
    
    return c.json({ channels: allGroups });
  } catch (error: any) {
    return c.json({ error: 'Failed to get channels' }, 500);
  }
});

// Admin: Verify channel
app.post(`/${SERVER_ID}/admin/channels/:id/verify`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const channelId = c.req.param('id');
    const body = await c.req.json();
    const { verified } = body;

    const channel = await kv.get(`group:${channelId}`);
    if (!channel) {
      return c.json({ error: 'Channel not found' }, 404);
    }

    channel.verified = verified;
    await kv.set(`group:${channelId}`, channel);

    return c.json({ channel });
  } catch (error: any) {
    return c.json({ error: 'Failed to verify channel' }, 500);
  }
});

// Admin: Get settings
app.get(`/${SERVER_ID}/admin/settings`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Get settings from KV store, or use defaults
    const settings = await kv.get('system:settings') || {
      serverName: 'ChozaChat Admin',
      maxGroupMembers: 50,
      allowRegistration: true,
      messageRetentionDays: 365,
      maxMessageLength: 2000,
      enableFileUploads: false,
      requireEmailVerification: false,
      enableOnlineStatus: true
    };

    return c.json({ settings });
  } catch (error: any) {
    return c.json({ error: 'Failed to get settings' }, 500);
  }
});

// Admin: Save settings
app.post(`/${SERVER_ID}/admin/settings`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const body = await c.req.json();
    
    // Store settings in KV
    await kv.set('system:settings', body);

    return c.json({ success: true, settings: body });
  } catch (error: any) {
    return c.json({ error: 'Failed to save settings' }, 500);
  }
});

// Admin: Get announcement
app.get(`/${SERVER_ID}/admin/announcement`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const announcement = await kv.get('system:announcement') || null;

    return c.json({ announcement });
  } catch (error: any) {
    return c.json({ error: 'Failed to get announcement' }, 500);
  }
});

// Admin: Create/Update announcement
app.post(`/${SERVER_ID}/admin/announcement`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const body = await c.req.json();
    const { title, description, enabled } = body;

    const announcement = {
      id: crypto.randomUUID(),
      title,
      description,
      enabled: enabled !== undefined ? enabled : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await kv.set('system:announcement', announcement);

    return c.json({ success: true, announcement });
  } catch (error: any) {
    return c.json({ error: 'Failed to save announcement' }, 500);
  }
});

// Admin: Disable announcement
app.post(`/${SERVER_ID}/admin/announcement/disable`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const announcement = await kv.get('system:announcement');
    if (announcement) {
      announcement.enabled = false;
      announcement.updatedAt = new Date().toISOString();
      await kv.set('system:announcement', announcement);
    }

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to disable announcement' }, 500);
  }
});

// Get active announcement (for all users)
app.get(`/${SERVER_ID}/announcement`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const announcement = await kv.get('system:announcement');
    
    // Check if user has dismissed this announcement
    if (announcement && announcement.enabled) {
      const dismissedKey = `user:${userId}:dismissed_announcements`;
      const dismissedAnnouncements = await kv.get(dismissedKey) || [];
      
      // If user hasn't dismissed this announcement, return it
      if (!dismissedAnnouncements.includes(announcement.id)) {
        return c.json({ announcement });
      }
    }

    return c.json({ announcement: null });
  } catch (error: any) {
    return c.json({ error: 'Failed to get announcement' }, 500);
  }
});

// Dismiss announcement for a user
app.post(`/${SERVER_ID}/announcement/dismiss`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const body = await c.req.json();
    const { announcementId } = body;

    if (!announcementId) {
      return c.json({ error: 'No announcement ID provided' }, 400);
    }

    const dismissedKey = `user:${userId}:dismissed_announcements`;
    const dismissedAnnouncements = await kv.get(dismissedKey) || [];
    
    if (!dismissedAnnouncements.includes(announcementId)) {
      dismissedAnnouncements.push(announcementId);
      await kv.set(dismissedKey, dismissedAnnouncements);
    }

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to dismiss announcement' }, 500);
  }
});

// Admin: Delete user
app.delete(`/${SERVER_ID}/admin/users/:id`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const targetUserId = c.req.param('id');
    
    // Cannot delete yourself
    if (targetUserId === userId) {
      return c.json({ error: 'Cannot delete your own account' }, 400);
    }

    // Delete user from auth and KV
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { error: authError } = await supabase.auth.admin.deleteUser(targetUserId);
    
    if (authError) {
      console.error('Failed to delete user from auth:', authError);
    }

    // Delete from KV
    await kv.del(`user:${targetUserId}`);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// Admin: Change user password
app.post(`/${SERVER_ID}/admin/users/:id/password`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const targetUserId = c.req.param('id');
    const body = await c.req.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { error } = await supabase.auth.admin.updateUserById(targetUserId, {
      password: newPassword
    });

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to change password' }, 500);
  }
});

// Admin: Mark password as compromised
app.post(`/${SERVER_ID}/admin/users/:id/password-compromised`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || (currentUser.email !== 'mikhail02323@gmail.com' && !currentUser.isModerator)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const targetUserId = c.req.param('id');
    const body = await c.req.json();
    const { compromised } = body;

    const targetUser = await kv.get(`user:${targetUserId}`);
    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    targetUser.passwordCompromised = compromised;
    await kv.set(`user:${targetUserId}`, targetUser);

    return c.json({ user: targetUser });
  } catch (error: any) {
    return c.json({ error: 'Failed to update password status' }, 500);
  }
});

// Admin: Verify user
app.post(`/${SERVER_ID}/admin/users/:id/verify`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const targetUserId = c.req.param('id');
    const body = await c.req.json();
    const { verified } = body;

    const targetUser = await kv.get(`user:${targetUserId}`);
    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    targetUser.verified = verified;
    await kv.set(`user:${targetUserId}`, targetUser);

    return c.json({ user: targetUser });
  } catch (error: any) {
    return c.json({ error: 'Failed to update verification status' }, 500);
  }
});

// Admin: Verify email
app.post(`/${SERVER_ID}/admin/users/:id/verify-email`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const targetUserId = c.req.param('id');
    const body = await c.req.json();
    const { emailVerified } = body;

    const targetUser = await kv.get(`user:${targetUserId}`);
    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    targetUser.emailVerified = emailVerified;
    await kv.set(`user:${targetUserId}`, targetUser);

    return c.json({ user: targetUser });
  } catch (error: any) {
    return c.json({ error: 'Failed to update email verification status' }, 500);
  }
});

// Admin: Set user tag
app.post(`/${SERVER_ID}/admin/users/:id/tag`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || (currentUser.email !== 'mikhail02323@gmail.com' && !currentUser.isModerator)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const targetUserId = c.req.param('id');
    const body = await c.req.json();
    const { tag, tagColor } = body;

    const targetUser = await kv.get(`user:${targetUserId}`);
    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    targetUser.tag = tag;
    targetUser.tagColor = tagColor;
    
    // Also mark as scammer in isScammer field if tag is SCAM
    if (tag === 'SCAM') {
      targetUser.isScammer = true;
    }

    await kv.set(`user:${targetUserId}`, targetUser);

    return c.json({ user: targetUser });
  } catch (error: any) {
    return c.json({ error: 'Failed to set tag' }, 500);
  }
});

// Admin: Set moderator status
app.post(`/${SERVER_ID}/admin/users/:id/moderator`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const targetUserId = c.req.param('id');
    const body = await c.req.json();
    const { moderator } = body;

    const targetUser = await kv.get(`user:${targetUserId}`);
    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    targetUser.isModerator = moderator;
    targetUser.moderator = moderator;

    // Add or remove MOD tag
    if (!targetUser.tags) targetUser.tags = [];
    
    if (moderator && !targetUser.tags.includes('MOD')) {
      targetUser.tags.push('MOD');
    } else if (!moderator) {
      targetUser.tags = targetUser.tags.filter((t: string) => t !== 'MOD');
    }

    await kv.set(`user:${targetUserId}`, targetUser);

    return c.json({ user: targetUser });
  } catch (error: any) {
    return c.json({ error: 'Failed to update moderator status' }, 500);
  }
});

// Troll: Global broadcast
app.post(`/${SERVER_ID}/admin/troll/broadcast`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const body = await c.req.json();
    const { message } = body;

    const trollData = {
      type: 'broadcast',
      message,
      timestamp: new Date().toISOString()
    };

    await kv.set('troll:active', trollData);

    setTimeout(async () => {
      await kv.del('troll:active');
    }, 10000);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to broadcast' }, 500);
  }
});

// Troll: Screen shake
app.post(`/${SERVER_ID}/admin/troll/shake`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const trollData = {
      type: 'shake',
      timestamp: new Date().toISOString()
    };

    await kv.set('troll:active', trollData);

    setTimeout(async () => {
      await kv.del('troll:active');
    }, 5000);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to shake' }, 500);
  }
});

// Troll: Confetti
app.post(`/${SERVER_ID}/admin/troll/confetti`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const trollData = {
      type: 'confetti',
      timestamp: new Date().toISOString()
    };

    await kv.set('troll:active', trollData);

    setTimeout(async () => {
      await kv.del('troll:active');
    }, 5000);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to trigger confetti' }, 500);
  }
});

// Troll: Fake update
app.post(`/${SERVER_ID}/admin/troll/update`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const trollData = {
      type: 'update',
      timestamp: new Date().toISOString()
    };

    await kv.set('troll:active', trollData);

    setTimeout(async () => {
      await kv.del('troll:active');
    }, 10000);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to trigger update' }, 500);
  }
});

// Troll: Emoji rain
app.post(`/${SERVER_ID}/admin/troll/emoji-rain`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const currentUser = await kv.get(`user:${userId}`);
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const body = await c.req.json();
    const { emoji } = body;

    const trollData = {
      type: 'emoji-rain',
      emoji: emoji || '🎉',
      timestamp: new Date().toISOString()
    };

    await kv.set('troll:active', trollData);

    setTimeout(async () => {
      await kv.del('troll:active');
    }, 5000);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to trigger emoji rain' }, 500);
  }
});

// Get active troll
app.get(`/${SERVER_ID}/troll/active`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const trollData = await kv.get('troll:active');

    return c.json({ troll: trollData || null });
  } catch (error: any) {
    return c.json({ error: 'Failed to get troll data' }, 500);
  }
});

// Catch-all route for debugging
app.all('*', (c) => {
  console.log('⛔ [CATCH-ALL] ===== UNMATCHED ROUTE =====');
  console.log('⛔ [CATCH-ALL] Method:', c.req.method);
  console.log('⛔ [CATCH-ALL] URL:', c.req.url);
  console.log('⛔ [CATCH-ALL] Path:', c.req.path);
  console.log('⛔ [CATCH-ALL] Authorization:', c.req.header('Authorization'));
  console.log('⛔ [CATCH-ALL] X-User-Id:', c.req.header('X-User-Id'));
  console.log('⛔ [CATCH-ALL] This means the route was not matched by any handler!');
  console.log('⛔ [CATCH-ALL] Expected SERVER_ID:', SERVER_ID);
  return c.json({ 
    error: 'Route not found', 
    path: c.req.path, 
    method: c.req.method,
    expectedPrefix: `/${SERVER_ID}/`,
    hint: 'Make sure the path starts with the correct SERVER_ID prefix'
  }, 404);
});

// Start the server with Hono
Deno.serve(app.fetch);