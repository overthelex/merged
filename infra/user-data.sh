#!/bin/bash
set -euxo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get -y upgrade
apt-get install -y ca-certificates curl gnupg git ufw jq unzip build-essential

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# pnpm via corepack
corepack enable
corepack prepare pnpm@9.15.0 --activate

# Caddy 2
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy

# Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Deploy user
id -u deploy >/dev/null 2>&1 || useradd -m -s /bin/bash deploy
usermod -aG docker deploy
mkdir -p /home/deploy/.ssh
cp /home/ubuntu/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# App directories
mkdir -p /srv/merged
chown -R deploy:deploy /srv/merged

# Firewall (ufw passthrough — SG is primary)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Swap (1 GB — t3.micro has 1 GB RAM, helps with node build spikes)
if [ ! -f /swapfile ]; then
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Placeholder site until real deploy
cat > /var/www/index.html <<'EOF'
<!doctype html><html lang="uk"><meta charset="utf-8"><title>merged</title>
<body style="font:16px/1.5 system-ui;padding:4rem;max-width:40rem;margin:auto;color:#0b0f17;background:#f7f6f1">
<h1>merged</h1><p>Сайт розгортається. Заходьте трохи пізніше.</p></body></html>
EOF
mkdir -p /var/www && chown -R caddy:caddy /var/www

# Minimal bootstrap Caddyfile (will be replaced by real config after first deploy)
cat > /etc/caddy/Caddyfile <<'EOF'
:80 {
  root * /var/www
  file_server
  encode zstd gzip
}
EOF
systemctl enable caddy
systemctl restart caddy

touch /var/log/merged-bootstrap.done
