// ChozaChat Hono Server for VPS deployment
// Migrated from Supabase Edge Functions to standalone Bun server

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from 'bun';

// Import your existing server routes from supabase/functions/server/index.tsx
// We'll keep the same logic but adapt it for standalone deployment

const app = new Hono();

const SERVER_ID = "make-server-a1c86d03";
const PORT = process.env.PORT || 3000;

console.log('🚀🚀🚀 CHOZACHAT API SERVER STARTING 🚀🚀🚀');
console.log('🚀 VERSION: VPS-STANDALONE-v1');
console.log('🚀 TIMESTAMP:', Date.now());
console.log('🚀 DEPLOYED AT:', new Date().toISOString());
console.log('🚀 PORT:', PORT);

// Apply CORS middleware FIRST
app.use('*', cors({
  origin: ['https://chozachat.xyz', 'http://localhost:5173', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
  credentials: true
}));

// Global request logger
app.use('*', async (c, next) => {
  console.log('🌐 [REQUEST]', c.req.method, c.req.path);
  await next();
  console.log('🌐 [RESPONSE]', c.res.status);
});

// Global error handler
app.onError((err, c) => {
  console.error('❌ [ERROR]', err);
  return c.json({ error: err.message || 'Internal server error' }, 500);
});

// Health check endpoint
app.get(`/${SERVER_ID}/health`, (c) => {
  return c.json({
    status: "ok",
    version: "VPS-STANDALONE-v1",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Version check endpoint
app.get(`/${SERVER_ID}/version`, (c) => {
  return c.json({
    version: "VPS-STANDALONE-v1",
    timestamp: Date.now(),
    bunVersion: Bun.version
  });
});

// TODO: Import and mount all routes from your existing server/index.tsx
// The routes should remain the same, just adapt the imports

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'ChozaChat API',
    version: 'VPS-STANDALONE-v1',
    endpoints: [
      `/${SERVER_ID}/health`,
      `/${SERVER_ID}/version`,
      // Add your other endpoints here
    ]
  });
});

// Start the server using Bun's native serve
serve({
  port: PORT,
  fetch: app.fetch,
  development: false
});

console.log(`✅ ChozaChat API is running on http://0.0.0.0:${PORT}`);
console.log(`✅ Health check: http://0.0.0.0:${PORT}/${SERVER_ID}/health`);
