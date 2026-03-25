import { Hono } from "npm:hono@4";
import { cors } from 'npm:hono/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// VERSION: 2024-03-25-v17-channels-consolidation

// Apply CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
}));

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
  return c.json({ status: "ok", version: "2024-03-25-v17-channels-consolidation", timestamp: new Date().toISOString() });
});

// Version check endpoint
app.get("/make-server-a1c86d03/version", (c) => {
  return c.json({ version: "2024-03-25-v17-channels-consolidation" });
});

const SERVER_ID = 'make-server-a1c86d03';

// Signup endpoint
app.post(`/${SERVER_ID}/signup`, async (c) => {
  try {
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

    // Create user in Supabase Auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, username, emoji }
    });

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    // Store user data in KV store
    const userData = {
      id: data.user.id,
      email,
      username,
      name,
      emoji: emoji || '👤',
      createdAt: new Date().toISOString(),
      tags: [],
      isScammer: false,
      isModerator: false
    };
    
    await kv.set(`user:${data.user.id}`, userData);

    return c.json({ success: true, user: userData });
  } catch (error: any) {
    return c.json({ error: error.message || 'Signup failed' }, 500);
  }
});

// Login endpoint
app.post(`/${SERVER_ID}/login`, async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return c.json({ error: error.message }, 401);
    }

    const userId = data.user.id;
    const accessToken = data.session.access_token;

    // Store session in KV
    const sessionData = {
      userId,
      accessToken,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const sessionKey = `session:${accessToken}`;
    await kv.set(sessionKey, sessionData);

    return c.json({ success: true });
  } catch (error: any) {
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

// Update user profile
app.put(`/${SERVER_ID}/user`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const body = await c.req.json();
    const { name, emoji, username } = body;

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
      ...(username && { username })
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
app.post(`/${SERVER_ID}/friends/request`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const body = await c.req.json();
    const { friendEmail } = body;

    const allUsers = await kv.getByPrefix('user:');
    const friend = allUsers.find((u: any) => u.username === friendEmail);

    if (!friend) {
      return c.json({ error: 'User not found' }, 404);
    }

    if (friend.id === userId) {
      return c.json({ error: 'Cannot add yourself as a friend' }, 400);
    }

    const existingFriendship = await kv.get(`friendship:${userId}:${friend.id}`) || 
                               await kv.get(`friendship:${friend.id}:${userId}`);
    
    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return c.json({ error: 'Already friends' }, 400);
      } else {
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

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to send friend request' }, 500);
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
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const body = await c.req.json();
    const { requesterId } = body;

    const friendshipId = `friendship:${requesterId}:${userId}`;
    const friendship = await kv.get(friendshipId);

    if (!friendship || friendship.status !== 'pending') {
      return c.json({ error: 'Friend request not found' }, 404);
    }

    friendship.status = 'accepted';
    friendship.acceptedAt = new Date().toISOString();
    await kv.set(friendshipId, friendship);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to accept friend request' }, 500);
  }
});

// Reject friend request
app.post(`/${SERVER_ID}/friends/reject`, async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const body = await c.req.json();
    const { requesterId } = body;

    const friendshipId = `friendship:${requesterId}:${userId}`;
    await kv.del(friendshipId);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: 'Failed to reject friend request' }, 500);
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

    const allGroups = await kv.getByPrefix('group:');
    const userGroups = allGroups.filter((g: any) => 
      g.members && g.members.includes(userId)
    );

    // Add news channel if user is authenticated
    const newsChannel = {
      id: 'news',
      name: 'News Channel',
      emoji: '📰',
      type: 'news',
      members: ['all']
    };

    return c.json({ channels: [newsChannel, ...userGroups] });
  } catch (error: any) {
    return c.json({ error: 'Failed to get channels' }, 500);
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
    const searchLower = query.toLowerCase();
    
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
    const { name, emoji } = body;

    const groupId = crypto.randomUUID();
    const groupData = {
      id: groupId,
      name,
      emoji: emoji || '👥',
      members: [userId],
      createdBy: userId,
      createdAt: new Date().toISOString()
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
    
    // Also delete messages
    await kv.del(`messages:group:${channelId}`);

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
      await kv.del(`messages:group:${channelId}`);
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
    
    // Try to determine chat type based on chatId
    let chatType = 'friend';
    
    // Check if it's a group
    const group = await kv.get(`group:${chatId}`);
    if (group) {
      chatType = 'group';
    }
    
    // Check if it's news
    if (chatId === 'news') {
      const news = await kv.get('news') || [];
      return c.json({ messages: news });
    }

    const messageKey = `messages:${chatType}:${chatId}`;
    const messages = await kv.get(messageKey) || [];

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
    if (!currentUser || currentUser.email !== 'mikhail02323@gmail.com') {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    const allUsers = await kv.getByPrefix('user:');
    
    return c.json({ users: allUsers });
  } catch (error: any) {
    return c.json({ error: 'Failed to get users' }, 500);
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

Deno.serve(app.fetch);