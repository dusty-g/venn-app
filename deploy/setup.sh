#!/bin/bash
set -e

# ============================================
# Venn App - GCP e2-micro Setup Script
# ============================================
# Run this on a fresh Debian/Ubuntu VM:
#   bash setup.sh YOUR_DOMAIN_OR_IP
# ============================================

DOMAIN=${1:?"Usage: bash setup.sh YOUR_DOMAIN_OR_IP"}
APP_DIR="/opt/venn-app"

echo "==> Installing system packages..."
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx git

# Install Node.js 20 via NodeSource
echo "==> Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pm2
echo "==> Installing pm2..."
sudo npm install -g pm2

# Clone or update app
if [ -d "$APP_DIR" ]; then
  echo "==> Updating app..."
  cd "$APP_DIR"
  git pull
else
  echo "==> Cloning app..."
  sudo git clone YOUR_REPO_URL "$APP_DIR"
  sudo chown -R "$USER:$USER" "$APP_DIR"
  cd "$APP_DIR"
fi

# Install deps and build
echo "==> Installing dependencies..."
npm install --production=false
echo "==> Building..."
npm run build

# Setup nginx
echo "==> Configuring nginx..."
sudo cp deploy/nginx.conf /etc/nginx/sites-available/venn-app
sudo sed -i "s/YOUR_DOMAIN_OR_IP/$DOMAIN/g" /etc/nginx/sites-available/venn-app
sudo ln -sf /etc/nginx/sites-available/venn-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Start app with pm2
echo "==> Starting app..."
cd "$APP_DIR"
export VENN_PASSPHRASE="${VENN_PASSPHRASE:?Set VENN_PASSPHRASE env var before running (e.g. export VENN_PASSPHRASE='my-secret-phrase')}"
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u "$USER" --hp "$HOME" | tail -1 | sudo bash

echo ""
echo "============================================"
echo " Venn app is live at http://$DOMAIN"
echo "============================================"
echo ""
echo "Optional: Add HTTPS with Let's Encrypt:"
echo "  sudo certbot --nginx -d $DOMAIN"
echo ""
echo "Useful commands:"
echo "  pm2 logs venn-app    # view logs"
echo "  pm2 restart venn-app # restart"
echo "  pm2 monit            # monitor"
echo ""
