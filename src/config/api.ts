// API Configuration
// Use PocketBase for VPS deployment

export const API_CONFIG = {
  mode: 'pocketbase' as 'pocketbase',
  pocketbase: {
    url: 'https://api.chozachat.xyz'
  }
};

// Import PocketBase client from lib
export { pb } from '../lib/pocketbase';

export const SERVER_ID = 'make-server-a1c86d03';

// Get the active API URL based on current mode
export function getApiUrl(): string {
  if (API_CONFIG.mode === 'vps') {
    return `${API_CONFIG.vps.baseUrl}/${SERVER_ID}`;
  }
  return `${API_CONFIG.supabase.baseUrl}/${SERVER_ID}`;
}

// Get Supabase credentials (still needed for Realtime)
export function getSupabaseConfig() {
  return {
    projectId: API_CONFIG.supabase.projectId,
    publicAnonKey: API_CONFIG.supabase.publicAnonKey,
    url: `https://${API_CONFIG.supabase.projectId}.supabase.co`
  };
}

// Helper function to make API requests
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  userId?: string
): Promise<Response> {
  const url = `${getApiUrl()}${endpoint}`;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${API_CONFIG.supabase.publicAnonKey}`);

  if (userId) {
    headers.set('X-User-Id', userId);
  }

  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * Migration Guide:
 *
 * 1. Deploy to VPS using ./vps-deploy/deploy.sh
 * 2. Test VPS API: curl https://api.chozachat.xyz/make-server-a1c86d03/health
 * 3. Change API_CONFIG.mode to 'vps'
 * 4. Rebuild and deploy frontend
 *
 * To rollback: Change API_CONFIG.mode back to 'supabase'
 */
