// PM2 ecosystem configuration for ChozaChat Hono server
// Optimized for 1 core, 2GB RAM VPS

export default {
  apps: [{
    name: 'chozachat-api',
    script: 'bun',
    args: 'run server.ts',
    cwd: '/var/www/chozachat-api',
    instances: 1, // Single instance for 1 core
    exec_mode: 'fork', // Fork mode instead of cluster for single core
    autorestart: true,
    watch: false,
    max_memory_restart: '1G', // Restart if memory exceeds 1GB (half of total)
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/chozachat-api-error.log',
    out_file: '/var/log/pm2/chozachat-api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 10000,
    // Auto-restart on crash with exponential backoff
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
};
