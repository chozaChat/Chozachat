# ChozaChat VPS Migration Checklist

## Pre-Migration

- [ ] Backup current Supabase data (KV store, user data)
- [ ] Test VPS SSH access: `ssh root@api.chozachat.xyz`
- [ ] Verify DNS: `dig api.chozachat.xyz` should point to VPS IP
- [ ] Update `/etc/hosts` for testing (optional):
  ```bash
  echo "YOUR_VPS_IP api.chozachat.xyz" >> /etc/hosts
  ```

## Migration Steps

### 1. Deploy Backend to VPS
- [ ] Run deployment script:
  ```bash
  cd vps-deploy
  chmod +x deploy.sh
  ./deploy.sh
  ```
- [ ] Verify deployment:
  ```bash
  ssh root@api.chozachat.xyz 'pm2 status'
  ```
- [ ] Test health endpoint:
  ```bash
  curl https://api.chozachat.xyz/make-server-a1c86d03/health
  ```

### 2. Data Migration
- [ ] Export data from Supabase KV store
- [ ] Import data to VPS KV store
  - Option A: Use Supabase storage if keeping Realtime
  - Option B: Migrate to PocketBase on VPS (already done per your background)
  
### 3. Update Frontend Configuration
- [ ] Open `src/config/api.ts`
- [ ] Change `mode: 'supabase'` to `mode: 'vps'`
- [ ] Rebuild frontend:
  ```bash
  npm run build
  # or
  bun run build
  ```
- [ ] Deploy updated frontend

### 4. Testing Phase
- [ ] Test login functionality
- [ ] Test message sending
- [ ] Test friend requests
- [ ] Test admin panel
- [ ] Test coin management
- [ ] Test subscription system
- [ ] Test all troll functions
- [ ] Test custom languages
- [ ] Monitor VPS resources:
  ```bash
  ssh root@api.chozachat.xyz 'pm2 monit'
  ```

### 5. Monitor & Optimize
- [ ] Monitor logs for 24 hours:
  ```bash
  ssh root@api.chozachat.xyz 'pm2 logs chozachat-api --lines 100'
  ```
- [ ] Check memory usage:
  ```bash
  ssh root@api.chozachat.xyz 'free -h'
  ```
- [ ] Check CPU usage:
  ```bash
  ssh root@api.chozachat.xyz 'top -b -n 1 | head -20'
  ```
- [ ] Verify SSL is working: `https://api.chozachat.xyz/make-server-a1c86d03/health`

## Rollback Plan

If something goes wrong:

1. **Quick Rollback** (Frontend only):
   - [ ] Change `mode: 'vps'` back to `mode: 'supabase'` in `src/config/api.ts`
   - [ ] Rebuild and redeploy frontend
   - [ ] This switches back to Supabase instantly

2. **Full Rollback** (if VPS has issues):
   - [ ] Follow quick rollback steps above
   - [ ] Stop VPS server: `ssh root@api.chozachat.xyz 'pm2 stop chozachat-api'`
   - [ ] Investigate and fix VPS issues
   - [ ] Re-deploy when ready

## Post-Migration

- [ ] Remove test entries from `/etc/hosts` if added
- [ ] Update documentation
- [ ] Setup monitoring (optional):
  - [ ] Uptime Kuma
  - [ ] Netdata
  - [ ] PM2 Plus (paid)
- [ ] Setup automated backups
- [ ] Configure log rotation
- [ ] Document any issues encountered

## Known Issues to Address

Based on your background context:

1. **Subscription Route Mismatch** ✅ FIXED
   - Frontend was using POST, backend expected POST (no mismatch found)
   - Using KV store `/kv/set` endpoint

2. **Features Temporarily Abandoned**
   - [ ] Restore bot system
   - [ ] Restore old stickers
   - Plan implementation after successful VPS migration

3. **Coin Management Location** ✅ FIXED
   - Moved from ChatMain.tsx to AdminPanel.tsx

## Resource Monitoring Thresholds

Your VPS has 1 core, 2GB RAM, 60GB SSD. Monitor these:

- **Memory**: Should stay under 1.5GB (75% of total)
  - If above 1.8GB: PM2 will auto-restart
  - If consistently high: Investigate memory leaks

- **CPU**: Should stay under 80% average
  - Spikes to 100% are okay during requests
  - If consistently 100%: Consider caching or optimization

- **Disk**: Should stay under 50GB
  - Monitor logs: `/var/log/pm2/`
  - Setup log rotation

- **Bandwidth**: Monitor if provider has limits
  - Track with: `vnstat` or similar tools

## Emergency Contacts & Resources

- VPS Provider Support: [Add your provider's support]
- Your Email: mikhail02323@gmail.com
- PM2 Docs: https://pm2.keymetrics.io/docs/usage/quick-start/
- Bun Docs: https://bun.sh/docs
- Nginx Docs: https://nginx.org/en/docs/

## Success Criteria

Migration is successful when:
- [ ] All endpoints returning 200 OK
- [ ] No errors in PM2 logs for 24 hours
- [ ] Memory usage stable under 1.5GB
- [ ] CPU usage normal (spikes okay, average <50%)
- [ ] All features working as before
- [ ] Response times similar or better than Supabase
- [ ] Cost savings achieved
