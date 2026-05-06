# ChozaChat VPS Deployment Guide

This directory contains everything needed to deploy your ChozaChat Hono server to your VPS at `api.chozachat.xyz`.

## 🎯 Optimizations for Your VPS Specs (1 core, 2GB RAM, 60GB SSD)

We're using **Bun + PM2** which is perfect for your specs:

### Why Bun?
- ⚡ **3x faster** than Node.js for HTTP requests
- 💾 **Lower memory footprint** (~50MB vs ~150MB for Node)
- 🚀 **Native TypeScript** support (no compilation needed)
- 📦 **Built-in bundler** and package manager

### Why PM2?
- 🔄 **Auto-restart** on crashes
- 📊 **Built-in monitoring** and logging
- 🎯 **Single instance mode** (perfect for 1 core)
- 💾 **Memory limits** (auto-restart if exceeds 1GB)
- 🔧 **Zero-downtime** deployments

## 📋 Prerequisites

1. VPS running Ubuntu/Debian
2. Root SSH access to `api.chozachat.xyz`
3. DNS A record pointing `api.chozachat.xyz` to your VPS IP

## 🚀 Deployment Steps

### Option 1: Automated Deployment (Recommended)

```bash
cd vps-deploy
chmod +x deploy.sh
./deploy.sh
```

This will:
1. Install Bun and PM2 on your VPS
2. Upload server files
3. Install dependencies
4. Configure PM2 with optimized settings
5. Setup Nginx reverse proxy with rate limiting
6. Setup SSL with Let's Encrypt

### Option 2: Manual Deployment

#### 1. Install Bun on VPS
```bash
ssh root@api.chozachat.xyz
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

#### 2. Install PM2
```bash
npm install -g pm2
```

#### 3. Create deployment directory
```bash
mkdir -p /var/www/chozachat-api
mkdir -p /var/log/pm2
```

#### 4. Upload files
```bash
scp server.ts root@api.chozachat.xyz:/var/www/chozachat-api/
scp ecosystem.config.mjs root@api.chozachat.xyz:/var/www/chozachat-api/
scp ../supabase/functions/server/kv_store.tsx root@api.chozachat.xyz:/var/www/chozachat-api/
scp ../supabase/functions/server/index.tsx root@api.chozachat.xyz:/var/www/chozachat-api/index-original.tsx
```

#### 5. Install dependencies and start
```bash
ssh root@api.chozachat.xyz
cd /var/www/chozachat-api
bun install hono
pm2 start ecosystem.config.mjs
pm2 save
pm2 startup
```

#### 6. Setup Nginx (see deploy.sh for full config)
```bash
apt install nginx certbot python3-certbot-nginx
# Configure Nginx reverse proxy on port 80 -> 3000
certbot --nginx -d api.chozachat.xyz
```

## 🔧 Management Commands

### View logs
```bash
ssh root@api.chozachat.xyz 'pm2 logs chozachat-api'
```

### Restart server
```bash
ssh root@api.chozachat.xyz 'pm2 restart chozachat-api'
```

### Stop server
```bash
ssh root@api.chozachat.xyz 'pm2 stop chozachat-api'
```

### Monitor resources
```bash
ssh root@api.chozachat.xyz 'pm2 monit'
```

### Check server status
```bash
ssh root@api.chozachat.xyz 'pm2 status'
```

## 📊 Performance Tips

### Memory Management
- PM2 is configured to restart if memory exceeds 1GB
- Bun uses ~50-100MB at baseline
- Leaves ~1.9GB for OS and other services

### CPU Usage
- Single instance runs on 1 core (no overhead from clustering)
- Bun's async I/O handles concurrent requests efficiently

### Nginx Rate Limiting
- Configured for 10 requests/second per IP
- Burst of 20 requests allowed
- Protects against DDoS and abuse

## 🔐 Security

1. **SSL/TLS**: Let's Encrypt provides free HTTPS
2. **Rate Limiting**: Nginx rate limits prevent abuse
3. **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
4. **Firewall**: Consider using UFW:
   ```bash
   ufw allow 22/tcp    # SSH
   ufw allow 80/tcp    # HTTP
   ufw allow 443/tcp   # HTTPS
   ufw enable
   ```

## 🌐 Updating Frontend API Endpoints

After deployment, update your frontend to use the new API:

```typescript
// Old (Supabase)
const API_URL = `https://${projectId}.supabase.co/functions/v1/${SERVER_ID}`;

// New (VPS)
const API_URL = 'https://api.chozachat.xyz/make-server-a1c86d03';
```

## 🐛 Troubleshooting

### Server not starting?
```bash
pm2 logs chozachat-api --lines 100
```

### Nginx errors?
```bash
nginx -t
tail -f /var/log/nginx/error.log
```

### Out of memory?
```bash
free -h
pm2 list
```

### High CPU usage?
```bash
top
pm2 monit
```

## 📈 Cost Savings

**Before (Supabase)**:
- Bandwidth costs
- Function invocation costs
- Database costs

**After (VPS)**:
- Fixed monthly cost (~$5-10/month for your specs)
- No bandwidth limits
- No invocation limits
- Full control

## ✅ Next Steps

After deployment:
1. Test API: `curl https://api.chozachat.xyz/make-server-a1c86d03/health`
2. Update frontend API URLs
3. Monitor logs for 24 hours
4. Setup monitoring (optional): Uptime Kuma, Netdata, etc.
