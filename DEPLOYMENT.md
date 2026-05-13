# Deployment Guide: Hostinger VPS

## Overview

This guide covers how to deploy the **Testy Psychologiczne** platform to a Hostinger VPS using Docker.

## Prerequisites

- Hostinger VPS with Ubuntu 22.04 (or later)
- SSH access to your VPS
- A domain name (optional but recommended)
- Docker and Docker Compose installed on the VPS

---

## 1. VPS Initial Setup

SSH into your VPS and install Docker:

```bash
ssh root@YOUR_VPS_IP

# Install Docker
curl -fsSL https://get.docker.com | sh

# Verify installation
docker --version
docker compose version
```

---

## 2. Upload Your Code

From your local machine, clone or upload your project to the VPS:

```bash
# Option A: Clone from GitHub
git clone https://github.com/YOUR_USERNAME/testy-psychologiczne---platforma.git /opt/testy-psychologiczne
cd /opt/testy-psychologiczne

# Option B: Copy via SCP
scp -r . root@YOUR_VPS_IP:/opt/testy-psychologiczne
```

---

## 3. Configure Environment Variables

On the VPS, create a `.env` file from the template:

```bash
cd /opt/testy-psychologiczne
cp .env.example .env
nano .env
```

Set the following values:

```env
# Use the internal Docker network hostname "db"
DATABASE_URL="postgresql://postgres:STRONG_DB_PASSWORD@db:5432/testy_psychologiczne"

# Generate a strong secret: openssl rand -base64 32
JWT_SECRET="paste-your-generated-secret-here"

NODE_ENV="production"
```

> **IMPORTANT**: Change `STRONG_DB_PASSWORD` to a long, random password. Also update the Docker Compose `db` service to use the same password.

Update `docker-compose.yml` database password to match:
```yaml
db:
  environment:
    POSTGRES_PASSWORD: STRONG_DB_PASSWORD  # Must match DATABASE_URL
```

---

## 4. Start the Application

```bash
# Build and start everything (database + app)
docker compose --profile app up -d --build

# Check that services are running
docker compose ps

# Watch application logs
docker compose logs -f app
```

---

## 5. Database Migrations

Migrations run **automatically** when the app container starts (via `prisma migrate deploy`).

To run manually if needed:

```bash
docker compose exec app npx prisma migrate deploy
```

---

## 6. Updating the Application

To deploy a new version:

```bash
cd /opt/testy-psychologiczne

# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose --profile app up -d --build
```

---

## 7. Nginx Reverse Proxy (Optional but Recommended)

Install Nginx on the VPS and proxy traffic to the app container:

```bash
apt install nginx -y
```

Create `/etc/nginx/sites-available/testy`:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/testy /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

For HTTPS, use Certbot:
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d YOUR_DOMAIN.com
```

---

## Local Development (with Docker)

To work locally using PostgreSQL (instead of SQLite):

```bash
# Start only the database containers
docker compose up -d db db_test

# Run the app normally in development mode
npm run dev

# Run tests (uses separate test DB on port 5433)
npm test
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `JWT_SECRET` | ✅ Yes | Secret key for JWT session signing (min 32 chars) |
| `NODE_ENV` | ✅ Yes | Set to `production` on the server |
| `SMTP_HOST` | ⬜ Optional | SMTP server for email notifications |
| `SMTP_PORT` | ⬜ Optional | SMTP port (usually 587) |
| `SMTP_USER` | ⬜ Optional | SMTP username |
| `SMTP_PASS` | ⬜ Optional | SMTP password |
| `SMTP_FROM` | ⬜ Optional | Sender email address |
