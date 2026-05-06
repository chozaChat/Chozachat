#!/bin/bash
# ChozaChat API VPS Deployment Script
# Optimized for Ubuntu/Debian with 1 core, 2GB RAM

set -e  # Exit on error

echo "🚀 ChozaChat API VPS Deployment Script"
echo "========================================"

# Configuration
VPS_USER="root"
VPS_HOST="api.chozachat.xyz"
DEPLOY_DIR="/var/www/chozachat-api"
SERVICE_NAME="chozachat-api"

echo "📦 Step 1: Installing Bun on VPS..."
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
# Install Bun if not already installed
if ! command -v bun &> /dev/null; then
    echo "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    source ~/.bashrc
fi
bun --version
ENDSSH

echo "📦 Step 2: Installing PM2 globally..."
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi
pm2 --version
ENDSSH

echo "📁 Step 3: Creating deployment directory..."
ssh ${VPS_USER}@${VPS_HOST} "mkdir -p ${DEPLOY_DIR} /var/log/pm2"

echo "📤 Step 4: Uploading server files..."
# Copy server files
scp server.ts ${VPS_USER}@${VPS_HOST}:${DEPLOY_DIR}/
scp ecosystem.config.mjs ${VPS_USER}@${VPS_HOST}:${DEPLOY_DIR}/
scp package.json ${VPS_USER}@${VPS_HOST}:${DEPLOY_DIR}/ 2>/dev/null || echo "No package.json found, skipping..."

# Copy KV store implementation
scp ../supabase/functions/server/kv_store.tsx ${VPS_USER}@${VPS_HOST}:${DEPLOY_DIR}/

# Copy main server logic
scp ../supabase/functions/server/index.tsx ${VPS_USER}@${VPS_HOST}:${DEPLOY_DIR}/index-original.tsx

echo "📦 Step 5: Installing dependencies on VPS..."
ssh ${VPS_USER}@${VPS_HOST} << ENDSSH
cd ${DEPLOY_DIR}
bun install hono
ENDSSH

echo "🔧 Step 6: Setting up PM2..."
ssh ${VPS_USER}@${VPS_HOST} << ENDSSH
cd ${DEPLOY_DIR}
# Stop existing process if any
pm2 delete ${SERVICE_NAME} 2>/dev/null || true
# Start the new process
pm2 start ecosystem.config.mjs
# Save PM2 process list
pm2 save
# Setup PM2 to start on boot
pm2 startup systemd -u ${VPS_USER} --hp /root
ENDSSH

echo "🔥 Step 7: Setting up Nginx reverse proxy..."
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
# Install Nginx if not already installed
if ! command -v nginx &> /dev/null; then
    apt update
    apt install -y nginx
fi

# Create Nginx configuration
cat > /etc/nginx/sites-available/chozachat-api << 'EOF'
server {
    listen 80;
    server_name api.chozachat.xyz;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/chozachat-api /etc/nginx/sites-enabled/
# Test and reload Nginx
nginx -t && systemctl reload nginx
ENDSSH

echo "🔐 Step 8: Setting up SSL with Let's Encrypt..."
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
# Install Certbot if not already installed
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi

# Get SSL certificate
certbot --nginx -d api.chozachat.xyz --non-interactive --agree-tos --email mikhail02323@gmail.com --redirect
ENDSSH

echo "✅ Deployment complete!"
echo ""
echo "📊 Server Status:"
ssh ${VPS_USER}@${VPS_HOST} "pm2 status && pm2 logs ${SERVICE_NAME} --lines 20 --nostream"

echo ""
echo "🎉 ChozaChat API is now live at:"
echo "   https://api.chozachat.xyz"
echo ""
echo "📝 Useful commands:"
echo "   - View logs:    ssh ${VPS_USER}@${VPS_HOST} 'pm2 logs ${SERVICE_NAME}'"
echo "   - Restart:      ssh ${VPS_USER}@${VPS_HOST} 'pm2 restart ${SERVICE_NAME}'"
echo "   - Stop:         ssh ${VPS_USER}@${VPS_HOST} 'pm2 stop ${SERVICE_NAME}'"
echo "   - Monitor:      ssh ${VPS_USER}@${VPS_HOST} 'pm2 monit'"
