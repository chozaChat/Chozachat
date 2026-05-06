// PocketBase client and helper functions
import PocketBase from 'pocketbase';

// Initialize PocketBase client
export const pb = new PocketBase('https://api.chozachat.xyz');

// Enable auto cancellation for pending requests
pb.autoCancellation(false);

// Types
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  verified: boolean; // System field - email verification
  emailVisibility: boolean; // System field
  customVerified: boolean; // Our custom verified badge
  emoji?: string;
  tag?: string;
  tagColor?: string;
  moderator: boolean;
  coins: number;
  trialUsed: boolean;
  subscription?: {
    tier: 'boost' | 'ultra' | null;
    expiresAt: string;
    tagGradient?: string;
    customGradient?: string;
  };
  lastActive?: string;
  passwordCompromised?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  username: string;
  emoji?: string;
  type: 'channel' | 'group' | 'dm';
  verified: boolean;
  members: string[];
  createdBy: string;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  channelId: string;
  timestamp: string;
  edited: boolean;
  editedAt?: string;
  type: 'text' | 'poll' | 'command' | 'sticker';
  pollData?: any;
  stickerData?: any;
  commandData?: any;
  replyTo?: string;
  reactions?: any;
  attachments?: any;
  status: 'sent' | 'delivered' | 'read';
}

export interface FriendRequest {
  id: string;
  from: string;
  to: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

// Auth helpers
export const login = async (email: string, password: string) => {
  return await pb.collection('users').authWithPassword(email, password);
};

export const register = async (email: string, password: string, name: string, username: string) => {
  const data = {
    email,
    password,
    passwordConfirm: password,
    name,
    username,
    emailVisibility: true,
  };
  return await pb.collection('users').create(data);
};

export const logout = () => {
  pb.authStore.clear();
};

export const getCurrentUser = (): User | null => {
  return pb.authStore.model as User | null;
};

// User operations
export const getUser = async (userId: string): Promise<User> => {
  return await pb.collection('users').getOne<User>(userId);
};

export const updateUser = async (userId: string, data: Partial<User>): Promise<User> => {
  return await pb.collection('users').update<User>(userId, data);
};

export const listUsers = async (): Promise<User[]> => {
  const result = await pb.collection('users').getFullList<User>({
    sort: '-lastActive',
  });
  return result;
};

// Channel operations
export const listChannels = async (): Promise<Channel[]> => {
  const userId = pb.authStore.model?.id;
  const result = await pb.collection('channels').getFullList<Channel>({
    filter: `type = "channel" || members.id ?= "${userId}"`,
    expand: 'members',
    sort: 'name',
  });
  return result;
};

export const getChannel = async (channelId: string): Promise<Channel> => {
  return await pb.collection('channels').getOne<Channel>(channelId, {
    expand: 'members',
  });
};

export const createChannel = async (data: Partial<Channel>): Promise<Channel> => {
  const userId = pb.authStore.model?.id;
  return await pb.collection('channels').create<Channel>({
    ...data,
    createdBy: userId,
    members: [userId],
  });
};

// Message operations
export const listMessages = async (channelId: string, limit = 50): Promise<Message[]> => {
  const result = await pb.collection('messages').getList<Message>(1, limit, {
    filter: `channelId = "${channelId}"`,
    sort: '-timestamp',
    expand: 'senderId',
  });
  return result.items.reverse(); // Newest last
};

export const sendMessage = async (channelId: string, content: string, type = 'text'): Promise<Message> => {
  const userId = pb.authStore.model?.id;
  return await pb.collection('messages').create<Message>({
    content,
    senderId: userId,
    channelId,
    type,
    timestamp: new Date().toISOString(),
  });
};

export const deleteMessage = async (messageId: string): Promise<boolean> => {
  return await pb.collection('messages').delete(messageId);
};

// Friend request operations
export const sendFriendRequest = async (toUserId: string): Promise<FriendRequest> => {
  const fromUserId = pb.authStore.model?.id;
  return await pb.collection('friendRequests').create<FriendRequest>({
    from: fromUserId,
    to: toUserId,
    status: 'pending',
  });
};

export const listFriendRequests = async (): Promise<FriendRequest[]> => {
  const userId = pb.authStore.model?.id;
  const result = await pb.collection('friendRequests').getFullList<FriendRequest>({
    filter: `to = "${userId}" && status = "pending"`,
    expand: 'from,to',
  });
  return result;
};

export const acceptFriendRequest = async (requestId: string): Promise<FriendRequest> => {
  return await pb.collection('friendRequests').update<FriendRequest>(requestId, {
    status: 'accepted',
  });
};

export const rejectFriendRequest = async (requestId: string): Promise<FriendRequest> => {
  return await pb.collection('friendRequests').update<FriendRequest>(requestId, {
    status: 'rejected',
  });
};

// KV store operations (for settings, sessions, etc.)
export const kvSet = async (key: string, value: any): Promise<void> => {
  try {
    const existing = await pb.collection('kv_store').getFirstListItem(`key="${key}"`);
    await pb.collection('kv_store').update(existing.id, { key, value });
  } catch {
    await pb.collection('kv_store').create({ key, value });
  }
};

export const kvGet = async (key: string): Promise<any> => {
  try {
    const record = await pb.collection('kv_store').getFirstListItem(`key="${key}"`);
    return record.value;
  } catch {
    return null;
  }
};

export const kvDelete = async (key: string): Promise<void> => {
  const record = await pb.collection('kv_store').getFirstListItem(`key="${key}"`);
  await pb.collection('kv_store').delete(record.id);
};

// Realtime subscriptions
export const subscribeToMessages = (channelId: string, callback: (message: Message) => void) => {
  return pb.collection('messages').subscribe<Message>('*', (e) => {
    if (e.record.channelId === channelId) {
      callback(e.record);
    }
  });
};

export const unsubscribeFromMessages = () => {
  pb.collection('messages').unsubscribe();
};

// Admin operations
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.email === 'mikhail02323@gmail.com';
};

export const isModerator = (): boolean => {
  const user = getCurrentUser();
  return user?.moderator === true || isAdmin();
};
