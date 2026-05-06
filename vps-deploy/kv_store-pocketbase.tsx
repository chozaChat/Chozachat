/* PocketBase KV Store - Replaces Supabase */

import PocketBase from 'pocketbase';

// Connect to your local PocketBase instance
const pb = new PocketBase('http://127.0.0.1:8090'); // Adjust port if different

// Auto-login as admin (or use a service account)
// You'll need to set these env vars or configure PocketBase auth
const initPB = async () => {
  if (!pb.authStore.isValid) {
    try {
      await pb.admins.authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL || 'admin@example.com',
        process.env.POCKETBASE_ADMIN_PASSWORD || 'changeme'
      );
    } catch (e) {
      console.warn('PocketBase auth failed, some operations may not work:', e);
    }
  }
  return pb;
};

// Collection name for KV store
const COLLECTION = 'kv_store';

// Set stores a key-value pair in PocketBase
export const set = async (key: string, value: any): Promise<void> => {
  const client = await initPB();

  try {
    // Try to find existing record
    const existing = await client.collection(COLLECTION).getFirstListItem(`key="${key}"`).catch(() => null);

    if (existing) {
      // Update existing
      await client.collection(COLLECTION).update(existing.id, { key, value });
    } else {
      // Create new
      await client.collection(COLLECTION).create({ key, value });
    }
  } catch (error: any) {
    throw new Error(`KV Set error: ${error.message}`);
  }
};

// Get retrieves a key-value pair from PocketBase
export const get = async (key: string): Promise<any> => {
  const client = await initPB();

  try {
    const record = await client.collection(COLLECTION).getFirstListItem(`key="${key}"`);
    return record.value;
  } catch (error: any) {
    // Return null if not found
    if (error.status === 404) return null;
    throw new Error(`KV Get error: ${error.message}`);
  }
};

// Delete deletes a key-value pair from PocketBase
export const del = async (key: string): Promise<void> => {
  const client = await initPB();

  try {
    const record = await client.collection(COLLECTION).getFirstListItem(`key="${key}"`);
    await client.collection(COLLECTION).delete(record.id);
  } catch (error: any) {
    if (error.status !== 404) {
      throw new Error(`KV Delete error: ${error.message}`);
    }
  }
};

// Sets multiple key-value pairs
export const mset = async (keys: string[], values: any[]): Promise<void> => {
  for (let i = 0; i < keys.length; i++) {
    await set(keys[i], values[i]);
  }
};

// Gets multiple key-value pairs
export const mget = async (keys: string[]): Promise<any[]> => {
  const results = [];
  for (const key of keys) {
    results.push(await get(key));
  }
  return results;
};

// Deletes multiple key-value pairs
export const mdel = async (keys: string[]): Promise<void> => {
  for (const key of keys) {
    await del(key);
  }
};

// Search for key-value pairs by prefix
export const getByPrefix = async (prefix: string): Promise<any[]> => {
  const client = await initPB();

  try {
    const records = await client.collection(COLLECTION).getFullList({
      filter: `key ~ "${prefix}"`
    });
    return records.map(r => r.value);
  } catch (error: any) {
    throw new Error(`KV GetByPrefix error: ${error.message}`);
  }
};

// Search for key-value pairs by prefix, returning both keys and values
export const getByPrefixWithKeys = async (prefix: string): Promise<Array<{key: string, value: any}>> => {
  const client = await initPB();

  try {
    const records = await client.collection(COLLECTION).getFullList({
      filter: `key ~ "${prefix}"`
    });
    return records.map(r => ({ key: r.key, value: r.value }));
  } catch (error: any) {
    throw new Error(`KV GetByPrefixWithKeys error: ${error.message}`);
  }
};
