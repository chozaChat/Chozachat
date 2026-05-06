# Cleanup & Install File Manager

## Step 1: Delete the Bad Files

On your VPS:

```bash
cd ~/chozachat
rm -f index.tsx kv_store.tsx
```

## Step 2: Install FileBrowser (Web File Manager)

FileBrowser is a lightweight, modern web file manager. Perfect for managing files via browser!

**On your VPS:**

```bash
# Install FileBrowser
curl -fsSL https://raw.githubusercontent.com/filebrowser/filebrowser/master/get.sh | bash

# Create config directory
mkdir -p ~/.config/filebrowser

# Create database and config
filebrowser config init -d ~/.config/filebrowser/filebrowser.db

# Set it to run on port 8080
filebrowser config set -p 8080 -r /root/chozachat -d ~/.config/filebrowser/filebrowser.db

# Set admin credentials
filebrowser users add admin your_password -d ~/.config/filebrowser/filebrowser.db

# Run it
filebrowser -d ~/.config/filebrowser/filebrowser.db
```

## Step 3: Add to Caddy (Optional - for HTTPS access)

Add this to your Caddyfile:

```
files.chozachat.xyz {
    reverse_proxy localhost:8080
}
```

Then reload Caddy:
```bash
sudo systemctl reload caddy
```

## Step 4: Access File Manager

- **Local:** `http://YOUR_VPS_IP:8080`
- **With Caddy:** `https://files.chozachat.xyz`

Login with:
- Username: `admin`
- Password: `your_password` (what you set above)

## Step 5: Auto-Start FileBrowser

Create systemd service:

```bash
sudo nano /etc/systemd/system/filebrowser.service
```

Paste:

```ini
[Unit]
Description=File Browser
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/filebrowser -d /root/.config/filebrowser/filebrowser.db
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable filebrowser
sudo systemctl start filebrowser
```

## Alternative: Tiny File Manager (Pure PHP)

If you prefer something even simpler:

```bash
cd ~/chozachat
wget https://raw.githubusercontent.com/prasathmani/tinyfilemanager/master/tinyfilemanager.php
mv tinyfilemanager.php filemanager.php

# Serve with PHP built-in server
php -S 0.0.0.0:8080 filemanager.php
```

Default login:
- Username: `admin`
- Password: `admin@123`

## Now You Can:

1. ✅ Upload `index.tsx` and `kv_store.tsx` via web UI
2. ✅ Edit files in your browser
3. ✅ No more nano/vim needed
4. ✅ Drag & drop files from your computer

Much easier! 🎉
