# Unified Operations Platform - Deployment Guide

## Quick Start for SSDNodes VPS

This guide will help you deploy the Unified Operations Platform on your SSDNodes VPS.

### Prerequisites

- SSDNodes VPS with Ubuntu 20.04+ or similar Linux distribution
- Root or sudo access
- Domain names pointed to your VPS:
  - `sitepandaseo.com`
  - `ducrm.com`
  - `my.logicinbound.com`

### Step 1: Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Upload Application Files

```bash
# Create application directory
sudo mkdir -p /opt/unified-ops-platform
cd /opt/unified-ops-platform

# Upload files via SCP, SFTP, or Git
# Example using SCP from your local machine:
# scp -r unified-ops-platform/* user@your-vps-ip:/opt/unified-ops-platform/
```

### Step 3: Configure Environment Variables

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit environment file
nano backend/.env
```

**Required Environment Variables:**

```env
# Database
DB_PASSWORD=your_secure_database_password_here

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars

# Allowed Origins
ALLOWED_ORIGINS=https://sitepandaseo.com,https://ducrm.com,https://my.logicinbound.com

# Session Secret
SESSION_SECRET=your_session_secret_min_32_chars
```

### Step 4: Configure Nginx for Multi-Domain

Create Nginx configuration:

```bash
sudo mkdir -p deployment/nginx/conf.d
```

Create `/opt/unified-ops-platform/deployment/nginx/nginx.conf`:

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    gzip on;

    include /etc/nginx/conf.d/*.conf;
}
```

Create `/opt/unified-ops-platform/deployment/nginx/conf.d/unified-ops.conf`:

```nginx
# Upstream backends
upstream backend_api {
    server backend:3001;
}

upstream frontend_app {
    server frontend:3000;
}

# SitePanda
server {
    listen 80;
    server_name sitepandaseo.com www.sitepandaseo.com;

    location / {
        proxy_pass http://frontend_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://backend_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /webhook/ {
        proxy_pass http://backend_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Decisions Unlimited
server {
    listen 80;
    server_name ducrm.com www.ducrm.com;

    location / {
        proxy_pass http://frontend_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://backend_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /webhook/ {
        proxy_pass http://backend_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Logic Inbound
server {
    listen 80;
    server_name my.logicinbound.com;

    location / {
        proxy_pass http://frontend_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://backend_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /webhook/ {
        proxy_pass http://backend_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 5: Deploy with Docker Compose

```bash
cd /opt/unified-ops-platform

# Build and start all services
sudo docker-compose up -d --build

# Check status
sudo docker-compose ps

# View logs
sudo docker-compose logs -f
```

### Step 6: Initialize Database

The database schema will be automatically applied on first startup. To verify:

```bash
# Access PostgreSQL container
sudo docker-compose exec postgres psql -U unified_ops_user -d unified_ops_platform

# Check tables
\dt

# Exit
\q
```

### Step 7: Set Up SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Stop Nginx container temporarily
sudo docker-compose stop nginx

# Get certificates for all domains
sudo certbot certonly --standalone -d sitepandaseo.com -d www.sitepandaseo.com
sudo certbot certonly --standalone -d ducrm.com -d www.ducrm.com
sudo certbot certonly --standalone -d my.logicinbound.com

# Update Nginx configuration to use SSL
# Edit deployment/nginx/conf.d/unified-ops.conf and add SSL blocks

# Restart Nginx
sudo docker-compose start nginx
```

### Step 8: Test the Deployment

```bash
# Test backend health
curl http://localhost:3001/health

# Test frontend
curl http://localhost:3000

# Test via domain (replace with your domain)
curl http://sitepandaseo.com
```

### Step 9: Access the Application

1. Open your browser and navigate to:
   - `https://sitepandaseo.com/login`
   - `https://ducrm.com/login`
   - `https://my.logicinbound.com/login`

2. Default admin credentials:
   - Email: `admin@unified-ops.com`
   - Password: `Admin123!`

**⚠️ IMPORTANT: Change the default password immediately after first login!**

## Maintenance Commands

### View Logs

```bash
# All services
sudo docker-compose logs -f

# Specific service
sudo docker-compose logs -f backend
sudo docker-compose logs -f frontend
sudo docker-compose logs -f postgres
```

### Restart Services

```bash
# Restart all
sudo docker-compose restart

# Restart specific service
sudo docker-compose restart backend
```

### Update Application

```bash
cd /opt/unified-ops-platform

# Pull latest changes (if using Git)
git pull

# Rebuild and restart
sudo docker-compose down
sudo docker-compose up -d --build
```

### Backup Database

```bash
# Create backup
sudo docker-compose exec postgres pg_dump -U unified_ops_user unified_ops_platform > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
sudo docker-compose exec -T postgres psql -U unified_ops_user unified_ops_platform < backup_file.sql
```

### Clean Up

```bash
# Stop and remove containers
sudo docker-compose down

# Remove volumes (⚠️ This deletes all data!)
sudo docker-compose down -v
```

## Troubleshooting

### Container won't start

```bash
# Check logs
sudo docker-compose logs backend

# Check if ports are in use
sudo netstat -tulpn | grep -E '3000|3001|5432'
```

### Database connection issues

```bash
# Verify database is running
sudo docker-compose ps postgres

# Check database logs
sudo docker-compose logs postgres

# Test connection
sudo docker-compose exec postgres psql -U unified_ops_user -d unified_ops_platform -c "SELECT 1;"
```

### Permission issues

```bash
# Fix upload directory permissions
sudo chmod -R 755 backend/uploads
sudo chown -R 1000:1000 backend/uploads
```

## Performance Optimization

### For Production Use

1. **Increase Database Resources:**
   Edit `docker-compose.yml` and add to postgres service:
   ```yaml
   command: postgres -c shared_buffers=256MB -c max_connections=200
   ```

2. **Enable Database Connection Pooling:**
   Already configured in backend (max: 20 connections)

3. **Set Up Monitoring:**
   ```bash
   # Install monitoring tools
   sudo apt install htop iotop nethogs -y
   ```

4. **Configure Automatic Backups:**
   ```bash
   # Add to crontab
   sudo crontab -e
   
   # Add line (daily backup at 2 AM):
   0 2 * * * cd /opt/unified-ops-platform && docker-compose exec -T postgres pg_dump -U unified_ops_user unified_ops_platform > /backups/unified_ops_$(date +\%Y\%m\%d).sql
   ```

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT secrets
- [ ] Enable SSL/HTTPS
- [ ] Configure firewall (UFW)
- [ ] Set up automatic security updates
- [ ] Restrict database access
- [ ] Enable fail2ban
- [ ] Regular backups configured
- [ ] Monitor logs for suspicious activity

## Support

For issues or questions:
1. Check logs: `sudo docker-compose logs -f`
2. Verify environment variables are set correctly
3. Ensure all domains point to your VPS IP
4. Check firewall rules allow ports 80 and 443

## Next Steps

1. **Configure Integrations:**
   - GoHighLevel API keys
   - Google Calendar OAuth
   - NiftyPM API keys
   - Teamwork API keys

2. **Customize Branding:**
   - Upload logos for each organization
   - Set brand colors in organization settings

3. **Create Users:**
   - Add team members
   - Assign organization roles
   - Set permissions

4. **Import Data:**
   - Import existing clients
   - Create projects
   - Set up opportunities

---

**Deployment completed! Your Unified Operations Platform is now running on your SSDNodes VPS.**

