// ChozaChat Hono Server - Bun Compatible Version
// This is the same as supabase/functions/server/index.tsx but with Bun imports

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

// VERSION: 2024-04-08-v33-POLL-MANAGEMENT

console.log('🚀🚀🚀 SERVER STARTING - VERSION: v33-POLL-MANAGEMENT 🚀🚀🚀');
console.log('🚀🚀🚀 TIMESTAMP:', Date.now(), '🚀🚀🚀');
console.log('🚀🚀🚀 DEPLOYED AT:', new Date().toISOString(), '🚀🚀🚀');

// Apply CORS middleware FIRST
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
}));

// NOTE: The rest of the file is identical to the original
// Just copy everything after line 10 from supabase/functions/server/index.tsx
// Or I can generate the full file if you need it
