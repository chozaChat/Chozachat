import { Hono } from "npm:hono@4";
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// VERSION: 2024-03-19-v9 - Bypass auth temporarily using X-User-Id header
console.log("=== SERVER STARTING - VERSION 2024-03-19-v9 ===");

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
}));

app.use('*', logger(console.log));

// Validate Supabase JWT directly - no session storage needed
async function validateSession(accessToken: string) {
  console.log("BYPASS AUTH - Returning hardcoded user ID from localStorage");
  
  // Temporary bypass: extract userId from request headers
  // The frontend will pass userId in a custom header
  return null; // Will be overridden per-endpoint
}

// Helper to get userId from Authorization header or fallback
function getUserIdFromRequest(c: any): string | null {
  // Try to get from custom header first
  const userIdHeader = c.req.header('X-User-Id');
  if (userIdHeader) {
    console.log("Got userId from X-User-Id header:", userIdHeader);
    return userIdHeader;
  }
  
  console.log("No X-User-Id header found");
  return null;
}

// Health check endpoint
app.get("/make-server-a1c86d03/health", (c) => {
  return c.json({ status: "ok", version: "2024-03-19-v9", timestamp: new Date().toISOString() });
});

// Sign up endpoint
app.post("/make-server-a1c86d03/signup", async (c) => {
  try {
    const { email, password, name, username } = await c.req.json();

    console.log("=== SIGNUP ENDPOINT ===");
    console.log("Email:", email);
    console.log("Username:", username);
    console.log("Name:", name);

    if (!email || !password || !name || !username) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Check if email already exists
    const allUsers = await kv.getByPrefix('user:');
    console.log("Existing users count:", allUsers.length);
    
    const emailExists = allUsers.some((u: any) => u.email === email);
    if (emailExists) {
      console.log("Email already taken:", email);
      return c.json({ error: "Email already taken" }, 400);
    }

    // Check if username already exists
    console.log("Existing usernames:", allUsers.map((u: any) => u.username).filter(Boolean));
    
    const usernameExists = allUsers.some((u: any) => u.username === username);
    
    if (usernameExists) {
      console.log("Username already taken:", username);
      return c.json({ error: "Username already taken" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
  // Используем ОБЫЧНЫЙ signUp, а не admin
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { 
        name: name, 
        username: username 
      }
    }
  });


    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    console.log("Supabase user created with ID:", data.user.id);

    // Store user profile with username
    const userData = {
      id: data.user.id,
      email,
      name,
      username,
      createdAt: new Date().toISOString()
    };
    
    console.log("Storing user data:", userData);
    await kv.set(`user:${data.user.id}`, userData);
    
    // Verify it was stored
    const verification = await kv.get(`user:${data.user.id}`);
    console.log("Verification - user stored:", !!verification);
    console.log("Verification - username:", verification?.username);

    console.log("=== SIGNUP SUCCESS ===");

    return c.json({ 
      success: true,
      user: {
        id: data.user.id,
        email,
        name,
        username
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

// Login endpoint to create session tokens
app.post("/make-server-a1c86d03/login", async (c) => {
  try {
    console.log("=== LOGIN ENDPOINT CALLED ===");
    const body = await c.req.json();
    console.log("Request body keys:", Object.keys(body));
    
    const { accessToken, userId } = body;

    if (!accessToken || !userId) {
      console.error("Missing required fields - accessToken:", !!accessToken, "userId:", !!userId);
      return c.json({ error: "Missing required fields" }, 400);
    }

    console.log("Login endpoint - Storing session for user:", userId);
    console.log("Token (first 30 chars):", accessToken.substring(0, 30));

    // Store the session token mapping
    const sessionData = {
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    const sessionKey = `session:${accessToken}`;
    console.log("Storing with key:", sessionKey.substring(0, 50));
    console.log("Session data:", sessionData);
    
    await kv.set(sessionKey, sessionData);
    
    // Verify it was stored
    console.log("Verifying storage...");
    const verification = await kv.get(sessionKey);
    console.log("Verification result:", !!verification, verification?.userId);

    console.log("=== LOGIN ENDPOINT SUCCESS ===");
    return c.json({ success: true });
  } catch (error) {
    console.error('Login session storage error:', error);
    console.error('Error stack:', error.stack);
    return c.json({ error: 'Failed to store session' }, 500);
  }
});

// Get user profile (with userId from header for admin panel)
app.get("/make-server-a1c86d03/user", async (c) => {
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
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// Get user profile (with userId as URL param)
app.get("/make-server-a1c86d03/user/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    const user = await kv.get(`user:${userId}`);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// Update user profile
app.post("/make-server-a1c86d03/user/update", async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const { name, username, tag, tagColor, emoji } = await c.req.json();

    if (!name || !username) {
      return c.json({ error: 'Name and username are required' }, 400);
    }

    // Check if username is already taken by another user
    const allUsers = await kv.getByPrefix('user:');
    const usernameExists = allUsers.some(
      (u: any) => u.username?.toLowerCase() === username.toLowerCase() && u.id !== userId
    );

    if (usernameExists) {
      return c.json({ error: 'Username already taken' }, 400);
    }

    // Get current user data
    const user = await kv.get(`user:${userId}`);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Only allow moderators to change tag color
    let finalTagColor = user.tagColor;
    if (user.moderator && tagColor !== undefined) {
      // Validate color is one of the allowed colors for moderators
      const allowedColors = ['#eab308', '#3b82f6', '#a855f7'];
      if (allowedColors.includes(tagColor)) {
        finalTagColor = tagColor;
      }
    }

    // Handle moderator tag - if they're a mod and clear their tag, default to MOD
    let finalTag = tag !== undefined ? tag : user.tag;
    if (user.moderator && (!finalTag || finalTag.trim() === '')) {
      finalTag = 'MOD';
    }

    // Update user data
    const updatedUser = {
      ...user,
      name,
      username,
      tag: finalTag,
      tagColor: finalTagColor,
      emoji: emoji !== undefined ? emoji : user.emoji, // Allow updating emoji
    };

    await kv.set(`user:${userId}`, updatedUser);

    return c.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// Update user activity
app.post("/make-server-a1c86d03/users/activity", async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    // Get current user data
    const user = await kv.get(`user:${userId}`);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Update lastActive timestamp
    const updatedUser = {
      ...user,
      lastActive: new Date().toISOString(),
    };

    await kv.set(`user:${userId}`, updatedUser);

    return c.json({ success: true });
  } catch (error) {
    console.error('Update user activity error:', error);
    return c.json({ error: 'Failed to update user activity' }, 500);
  }
});

// Lookup user by username
app.get("/make-server-a1c86d03/user/lookup", async (c) => {
  try {
    const username = c.req.query('username');
    
    console.log("=== USERNAME LOOKUP ===");
    console.log("Looking up username:", username);
    
    if (!username) {
      return c.json({ error: 'Username is required' }, 400);
    }
    
    const allUsers = await kv.getByPrefix('user:');
    console.log("Total users in database:", allUsers.length);
    
    const allUsernames = allUsers.map((u: any) => u.username).filter(Boolean);
    console.log("All usernames in database:", allUsernames);
    
    const user = allUsers.find((u: any) => 
      u.username && u.username.toLowerCase() === username.toLowerCase()
    );
    
    console.log("User found:", !!user);
    
    if (!user) {
      console.log("Username not found:", username);
      console.log("Available usernames:", allUsernames.length > 0 ? allUsernames.join(', ') : 'No usernames in database');
      
      // Return helpful error message
      if (allUsernames.length === 0) {
        return c.json({ 
          error: 'User not found', 
          hint: 'No users with usernames exist yet. Please sign up first.' 
        }, 404);
      } else {
        return c.json({ 
          error: 'User not found',
          hint: `Username "${username}" not found. Check your spelling or sign up.`
        }, 404);
      }
    }

    console.log("Username found! Email:", user.email);
    // Return only email for login purposes (don't expose full user data)
    return c.json({ email: user.email });
  } catch (error) {
    console.error('Lookup user error:', error);
    return c.json({ error: 'Failed to lookup user' }, 500);
  }
});

// Send friend request
app.post("/make-server-a1c86d03/friends/request", async (c) => {
  try {
    console.log("Friend request - Starting");
    const userId = getUserIdFromRequest(c);
    console.log("Friend request - UserId from header:", userId);
    
    if (!userId) {
      console.error("Friend request - No user ID provided");
      return c.json({ code: 401, message: 'No user ID provided' }, 401);
    }

    const body = await c.req.json();
    console.log("Friend request - Request body:", body);
    const { friendEmail } = body;

    // Find friend by username
    const allUsers = await kv.getByPrefix('user:');
    console.log("Friend request - Total users found:", allUsers.length);
    const friend = allUsers.find((u: any) => u.username === friendEmail);
    console.log("Friend request - Friend found:", !!friend, friend?.username);

    if (!friend) {
      console.error("Friend request - User not found:", friendEmail);
      return c.json({ error: 'User not found' }, 404);
    }

    if (friend.id === userId) {
      console.error("Friend request - Cannot add yourself");
      return c.json({ error: 'Cannot add yourself as a friend' }, 400);
    }

    // Check if already friends or request exists
    const existingFriendship = await kv.get(`friendship:${userId}:${friend.id}`) || 
                               await kv.get(`friendship:${friend.id}:${userId}`);
    console.log("Friend request - Existing friendship:", !!existingFriendship, existingFriendship?.status);
    
    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return c.json({ error: 'Already friends' }, 400);
      } else {
        return c.json({ error: 'Friend request already pending' }, 400);
      }
    }

    // Create friend request (pending status)
    const friendshipId = `friendship:${userId}:${friend.id}`;
    const friendshipData = {
      requesterId: userId,
      receiverId: friend.id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    console.log("Friend request - Creating friendship:", friendshipId, friendshipData);
    await kv.set(friendshipId, friendshipData);
    console.log("Friend request - Success");

    return c.json({ success: true, friend });
  } catch (error) {
    console.error('Friend request error:', error);
    return c.json({ error: `Failed to send friend request: ${error.message}` }, 500);
  }
});

// Get friends list
app.get("/make-server-a1c86d03/friends", async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ code: 401, message: 'No user ID provided' }, 401);
    }

    const friendships = await kv.getByPrefix('friendship:');
    const friendIds: string[] = [];

    // Only include accepted friendships
    friendships.forEach((f: any) => {
      if (f.status === 'accepted') {
        if (f.requesterId === userId) {
          friendIds.push(f.receiverId);
        } else if (f.receiverId === userId) {
          friendIds.push(f.requesterId);
        }
      }
    });

    const friends = await Promise.all(
      friendIds.map(id => kv.get(`user:${id}`))
    );

    return c.json({ friends: friends.filter(Boolean) });
  } catch (error) {
    console.error('Get friends error:', error);
    return c.json({ error: 'Failed to get friends' }, 500);
  }
});

// Get pending friend requests
app.get("/make-server-a1c86d03/friends/requests", async (c) => {
  try {
    console.log("=== Friend Requests Endpoint ===");
    const userId = getUserIdFromRequest(c);
    console.log("UserId from X-User-Id header:", userId);
    
    if (!userId) {
      console.error("Friend requests - No user ID provided");
      return c.json({ code: 401, message: 'No user ID provided' }, 401);
    }

    console.log("Friend requests - User authenticated:", userId);

    const friendships = await kv.getByPrefix('friendship:');
    const pendingRequests: any[] = [];

    // Get requests sent to this user
    for (const f of friendships) {
      if (f.status === 'pending' && f.receiverId === userId) {
        const requester = await kv.get(`user:${f.requesterId}`);
        if (requester) {
          pendingRequests.push({
            ...f,
            requester
          });
        }
      }
    }

    console.log("Friend requests - Success, found:", pendingRequests.length, "requests");
    return c.json({ requests: pendingRequests });
  } catch (error) {
    console.error('Get friend requests error:', error);
    console.error('Error stack:', error.stack);
    return c.json({ error: 'Failed to get friend requests' }, 500);
  }
});

// Accept friend request
app.post("/make-server-a1c86d03/friends/accept", async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const { requesterId } = await c.req.json();

    // Find the friend request
    const friendshipId = `friendship:${requesterId}:${userId}`;
    const friendship = await kv.get(friendshipId);

    if (!friendship) {
      return c.json({ error: 'Friend request not found' }, 404);
    }

    if (friendship.status !== 'pending') {
      return c.json({ error: 'Request already processed' }, 400);
    }

    // Update to accepted
    await kv.set(friendshipId, {
      ...friendship,
      status: 'accepted',
      acceptedAt: new Date().toISOString()
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Accept friend request error:', error);
    return c.json({ error: 'Failed to accept friend request' }, 500);
  }
});

// Decline friend request
app.post("/make-server-a1c86d03/friends/decline", async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const { requesterId } = await c.req.json();

    // Find and delete the friend request
    const friendshipId = `friendship:${requesterId}:${userId}`;
    const friendship = await kv.get(friendshipId);

    if (!friendship) {
      return c.json({ error: 'Friend request not found' }, 404);
    }

    await kv.del(friendshipId);

    return c.json({ success: true });
  } catch (error) {
    console.error('Decline friend request error:', error);
    return c.json({ error: 'Failed to decline friend request' }, 500);
  }
});

// Remove friend
app.post("/make-server-a1c86d03/friends/remove", async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const { friendId } = await c.req.json();

    // Find and delete the friendship (check both directions)
    const friendshipId1 = `friendship:${userId}:${friendId}`;
    const friendshipId2 = `friendship:${friendId}:${userId}`;
    
    const friendship1 = await kv.get(friendshipId1);
    const friendship2 = await kv.get(friendshipId2);

    if (friendship1) {
      await kv.del(friendshipId1);
    } else if (friendship2) {
      await kv.del(friendshipId2);
    } else {
      return c.json({ error: 'Friendship not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Remove friend error:', error);
    return c.json({ error: 'Failed to remove friend' }, 500);
  }
});

// Create group
app.post("/make-server-a1c86d03/groups", async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const { name, memberIds, emoji } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Group name is required' }, 400);
    }

    const groupId = crypto.randomUUID();
    const members = [userId, ...(memberIds || [])];

    await kv.set(`group:${groupId}`, {
      id: groupId,
      name,
      creatorId: userId,
      members,
      emoji: emoji || undefined,
      createdAt: new Date().toISOString()
    });

    return c.json({ 
      success: true,
      group: {
        id: groupId,
        name,
        members,
        creatorId: userId,
        emoji: emoji || undefined
      }
    });
  } catch (error) {
    console.error('Create group error:', error);
    return c.json({ error: 'Failed to create group' }, 500);
  }
});

// Get user's groups
app.get("/make-server-a1c86d03/groups", async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ code: 401, message: 'No user ID provided' }, 401);
    }

    const allGroups = await kv.getByPrefix('group:');
    const userGroups = allGroups.filter((g: any) => g.members?.includes(userId));

    return c.json({ groups: userGroups });
  } catch (error) {
    console.error('Get groups error:', error);
    return c.json({ error: 'Failed to get groups' }, 500);
  }
});

// Update group
app.put("/make-server-a1c86d03/groups/:groupId", async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const groupId = c.req.param('groupId');
    const { name, emoji } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Group name is required' }, 400);
    }

    const group = await kv.get(`group:${groupId}`);
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    // Check if user is a member of the group
    if (!group.members.includes(userId)) {
      return c.json({ error: 'You are not a member of this group' }, 403);
    }

    // Update group
    const updatedGroup = {
      ...group,
      name,
      emoji: emoji !== undefined ? emoji : group.emoji,
    };

    await kv.set(`group:${groupId}`, updatedGroup);

    return c.json({ success: true, group: updatedGroup });
  } catch (error) {
    console.error('Update group error:', error);
    return c.json({ error: 'Failed to update group' }, 500);
  }
});

// Add members to group
app.post("/make-server-a1c86d03/groups/:groupId/members", async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const groupId = c.req.param('groupId');
    const { memberIds } = await c.req.json();

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return c.json({ error: 'Member IDs are required' }, 400);
    }

    const group = await kv.get(`group:${groupId}`);
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    // Check if user is a member of the group
    if (!group.members.includes(userId)) {
      return c.json({ error: 'You are not a member of this group' }, 403);
    }

    // Filter out members already in the group
    const newMembers = memberIds.filter((id: string) => !group.members.includes(id));

    if (newMembers.length === 0) {
      return c.json({ error: 'All selected users are already members' }, 400);
    }

    // Update group with new members
    const updatedGroup = {
      ...group,
      members: [...group.members, ...newMembers],
    };

    await kv.set(`group:${groupId}`, updatedGroup);

    return c.json({ success: true, group: updatedGroup, addedCount: newMembers.length });
  } catch (error) {
    console.error('Add members error:', error);
    return c.json({ error: 'Failed to add members' }, 500);
  }
});

// Delete group
app.delete("/make-server-a1c86d03/groups/:groupId", async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const groupId = c.req.param('groupId');

    const group = await kv.get(`group:${groupId}`);
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    // Only the creator can delete the group
    if (group.creatorId !== userId) {
      return c.json({ error: 'Only the group creator can delete the group' }, 403);
    }

    // Delete the group
    await kv.del(`group:${groupId}`);

    // Delete all messages in the group
    const messages = await kv.getByPrefix(`message:${groupId}:`);
    for (const message of messages) {
      await kv.del(`message:${groupId}:${message.id}`);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete group error:', error);
    return c.json({ error: 'Failed to delete group' }, 500);
  }
});

// Send message
app.post("/make-server-a1c86d03/messages", async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const { chatId, text, chatType } = await c.req.json();

    if (!chatId || !text) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const messageId = crypto.randomUUID();
    const message = {
      id: messageId,
      chatId,
      chatType,
      senderId: userId,
      text,
      timestamp: new Date().toISOString()
    };

    await kv.set(`message:${chatId}:${messageId}`, message);

    return c.json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Get messages for a chat
app.get("/make-server-a1c86d03/messages/:chatId", async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    const chatId = c.req.param('chatId');
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const messages = await kv.getByPrefix(`message:${chatId}:`);
    const sortedMessages = messages.sort((a: any, b: any) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return c.json({ messages: sortedMessages });
  } catch (error) {
    console.error('Get messages error:', error);
    return c.json({ error: 'Failed to get messages' }, 500);
  }
});

// Get news channel messages (special endpoint)
app.get("/make-server-a1c86d03/news", async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    const messages = await kv.getByPrefix(`message:news-channel:`);
    const sortedMessages = messages.sort((a: any, b: any) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return c.json({ messages: sortedMessages });
  } catch (error) {
    console.error('Get news messages error:', error);
    return c.json({ error: 'Failed to get news messages' }, 500);
  }
});

// Post message to news channel (admin only)
app.post("/make-server-a1c86d03/news", async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    // Check if user is admin
    if (!(await isAdmin(userId))) {
      return c.json({ error: 'Unauthorized - Only admin can post to news channel' }, 403);
    }

    const { text } = await c.req.json();
    
    if (!text || !text.trim()) {
      return c.json({ error: 'Message text is required' }, 400);
    }

    const messageId = crypto.randomUUID();
    const message = {
      id: messageId,
      chatId: 'news-channel',
      senderId: userId,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    await kv.set(`message:news-channel:${messageId}`, message);

    return c.json({ success: true, message });
  } catch (error) {
    console.error('Post news message error:', error);
    return c.json({ error: 'Failed to post news message' }, 500);
  }
});

// Get server statistics
app.get("/make-server-a1c86d03/stats", async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    // Get all users
    const allUsers = await kv.getByPrefix('user:');
    const totalUsers = allUsers.length;

    // Get online users (users who have been active in the last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const onlineUsers = allUsers.filter((user: any) => {
      if (!user.lastActive) return false;
      return user.lastActive > fiveMinutesAgo;
    }).length;

    return c.json({ 
      totalUsers,
      onlineUsers
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return c.json({ error: 'Failed to get stats' }, 500);
  }
});

// NO-AUTH KV ENDPOINTS - Temporary bypass for deployment issues
app.get("/make-server-a1c86d03/kv/get/:key", async (c) => {
  try {
    const key = c.req.param('key');
    const value = await kv.get(key);
    return c.json({ value });
  } catch (error) {
    return c.json({ error: 'KV get failed' }, 500);
  }
});

// ===== ADMIN ENDPOINTS - Only for mikhail02323@gmail.com =====

// Helper to check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const user = await kv.get(`user:${userId}`);
  return user?.email === 'mikhail02323@gmail.com';
}

// Get all users (admin only)
app.get("/make-server-a1c86d03/admin/users", async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    if (!(await isAdmin(userId))) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    const allUsers = await kv.getByPrefix('user:');
    
    return c.json({ users: allUsers });
  } catch (error) {
    console.error('Get all users error:', error);
    return c.json({ error: 'Failed to get users' }, 500);
  }
});

// Delete user (admin only)
app.delete("/make-server-a1c86d03/admin/users/:targetUserId", async (c) => {
  try {
    const userId = getUserIdFromRequest(c);
    const targetUserId = c.req.param('targetUserId');
    
    if (!userId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    if (!(await isAdmin(userId))) {
      return c.json({ error: 'Unauthorized - Admin access required' }, 403);
    }

    // Prevent admin from deleting themselves
    if (userId === targetUserId) {
      return c.json({ error: 'Cannot delete your own account' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(targetUserId);
    if (authError) {
      console.error('Error deleting user from auth:', authError);
    }

    // Delete user data from KV
    await kv.del(`user:${targetUserId}`);

    // Delete all friendships
    const friendships = await kv.getByPrefix('friendship:');
    for (const friendship of friendships) {
      if (friendship.requesterId === targetUserId || friendship.receiverId === targetUserId) {
        const key = `friendship:${friendship.requesterId}:${friendship.receiverId}`;
        await kv.del(key);
      }
    }

    // Remove from groups
    const groups = await kv.getByPrefix('group:');
    for (const group of groups) {
      if (group.members?.includes(targetUserId)) {
        const updatedMembers = group.members.filter((m: string) => m !== targetUserId);
        await kv.set(`group:${group.id}`, {
          ...group,
          members: updatedMembers
        });
      }
    }

    // Delete user's messages
    const messages = await kv.getByPrefix('message:');
    for (const message of messages) {
      if (message.senderId === targetUserId) {
        const key = `message:${message.chatId}:${message.id}`;
        await kv.del(key);
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// Admin: Change user password
app.post("/make-server-a1c86d03/admin/users/:userId/password", async (c) => {
  try {
    const adminUserId = getUserIdFromRequest(c);
    
    if (!adminUserId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    // Check if user is admin
    if (!(await isAdmin(adminUserId))) {
      return c.json({ error: 'Unauthorized - Admin only' }, 403);
    }

    const targetUserId = c.req.param('userId');
    const { newPassword } = await c.req.json();

    if (!newPassword || newPassword.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Update password in Supabase Auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    const { error } = await supabase.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    );

    if (error) {
      console.error('Failed to update password:', error);
      return c.json({ error: 'Failed to update password: ' + error.message }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json({ error: 'Failed to change password' }, 500);
  }
});

// Admin: Mark password as compromised (old endpoint for backward compatibility)
app.post("/make-server-a1c86d03/admin/users/:userId/password-compromised", async (c) => {
  try {
    const adminUserId = getUserIdFromRequest(c);
    
    if (!adminUserId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    // Check if user is admin or moderator
    const currentUser = await kv.get(`user:${adminUserId}`);
    const isAdminUser = await isAdmin(adminUserId);
    const isModerator = currentUser?.moderator === true;

    if (!isAdminUser && !isModerator) {
      return c.json({ error: 'Unauthorized - Admin or Moderator privileges required' }, 403);
    }

    const targetUserId = c.req.param('userId');
    const { compromised } = await c.req.json();

    // Get user and set compromised status
    const user = await kv.get(`user:${targetUserId}`);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    user.passwordCompromised = compromised;
    await kv.set(`user:${targetUserId}`, user);

    return c.json({ success: true });
  } catch (error) {
    console.error('Mark password compromised error:', error);
    return c.json({ error: 'Failed to mark password as compromised' }, 500);
  }
});

// Admin: Set user tag
app.post("/make-server-a1c86d03/admin/users/:userId/tag", async (c) => {
  try {
    const adminUserId = getUserIdFromRequest(c);
    
    if (!adminUserId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    // Check if user is admin or moderator
    const currentUser = await kv.get(`user:${adminUserId}`);
    const isAdminUser = await isAdmin(adminUserId);
    const isModerator = currentUser?.moderator === true;

    if (!isAdminUser && !isModerator) {
      return c.json({ error: 'Unauthorized - Admin or Moderator privileges required' }, 403);
    }

    const targetUserId = c.req.param('userId');
    const { tag, tagColor } = await c.req.json();

    // Get user and set tag
    const user = await kv.get(`user:${targetUserId}`);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    user.tag = tag;
    user.tagColor = tagColor;
    await kv.set(`user:${targetUserId}`, user);

    return c.json({ success: true });
  } catch (error) {
    console.error('Set user tag error:', error);
    return c.json({ error: 'Failed to set user tag' }, 500);
  }
});

// Admin: Verify/unverify user
app.post("/make-server-a1c86d03/admin/users/:userId/verify", async (c) => {
  try {
    const adminUserId = getUserIdFromRequest(c);
    
    if (!adminUserId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    // Check if user is admin
    if (!(await isAdmin(adminUserId))) {
      return c.json({ error: 'Unauthorized - Admin only' }, 403);
    }

    const targetUserId = c.req.param('userId');
    const { verified } = await c.req.json();

    // Get user and set verified status
    const user = await kv.get(`user:${targetUserId}`);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    user.verified = verified;
    await kv.set(`user:${targetUserId}`, user);

    return c.json({ success: true });
  } catch (error) {
    console.error('Verify user error:', error);
    return c.json({ error: 'Failed to verify user' }, 500);
  }
});

// Admin: Set moderator status
app.post("/make-server-a1c86d03/admin/users/:userId/moderator", async (c) => {
  try {
    const adminUserId = getUserIdFromRequest(c);
    
    if (!adminUserId) {
      return c.json({ error: 'No user ID provided' }, 401);
    }

    // Check if user is admin (only admins can promote to moderator)
    if (!(await isAdmin(adminUserId))) {
      return c.json({ error: 'Unauthorized - Admin only' }, 403);
    }

    const targetUserId = c.req.param('userId');
    const { moderator } = await c.req.json();

    // Get user and set moderator status
    const user = await kv.get(`user:${targetUserId}`);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    user.moderator = moderator;
    
    // When promoting to moderator, automatically set yellow MOD tag
    if (moderator) {
      user.tag = 'MOD';
      user.tagColor = '#eab308'; // yellow-500
    } else {
      // When removing moderator, clear the MOD tag if it was set
      if (user.tag === 'MOD') {
        user.tag = undefined;
        user.tagColor = undefined;
      }
    }
    
    await kv.set(`user:${targetUserId}`, user);

    return c.json({ success: true });
  } catch (error) {
    console.error('Set moderator error:', error);
    return c.json({ error: 'Failed to set moderator status' }, 500);
  }
});

app.get("/make-server-a1c86d03/kv/prefix/:prefix", async (c) => {
  try {
    const prefix = c.req.param('prefix');
    const values = await kv.getByPrefix(prefix);
    return c.json({ values });
  } catch (error) {
    return c.json({ error: 'KV getByPrefix failed' }, 500);
  }
});

app.post("/make-server-a1c86d03/kv/set", async (c) => {
  try {
    const { key, value } = await c.req.json();
    await kv.set(key, value);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'KV set failed' }, 500);
  }
});

app.delete("/make-server-a1c86d03/kv/delete/:key", async (c) => {
  try {
    const key = c.req.param('key');
    await kv.del(key);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'KV del failed' }, 500);
  }
});

Deno.serve(app.fetch);