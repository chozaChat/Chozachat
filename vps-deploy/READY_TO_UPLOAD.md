# Ready-to-Upload Files

After installing FileBrowser, you can upload these files directly through the web UI!

## Files to Upload to `~/chozachat/`:

1. **index.tsx** - Your API server (see `vps-deploy/index-ready.tsx`)
2. **kv_store.tsx** - PocketBase KV store (see `vps-deploy/kv_store-pocketbase.tsx`)

## Quick Instructions:

**On your VPS:**

```bash
# 1. Clean up old files
cd ~/chozachat
rm -f index.tsx kv_store.tsx

# 2. Install FileBrowser
curl -fsSL https://raw.githubusercontent.com/filebrowser/filebrowser/master/get.sh | bash
filebrowser config init
filebrowser config set -p 8080 -r /root/chozachat
filebrowser users add admin YourPassword123
filebrowser &
```

**Then:**
1. Open `http://YOUR_VPS_IP:8080` in browser
2. Login (admin / YourPassword123)
3. Upload the 2 files I'll give you
4. Done!

**Or use this one-liner to create both files:**

I'll create a script that does it all automatically...
