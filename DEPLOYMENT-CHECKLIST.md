# Unified Operations Platform - Deployment Checklist

## Pre-Deployment Checklist

### 1. Domain Configuration
- [ ] `sitepandaseo.com` A record points to VPS IP
- [ ] `ducrm.com` A record points to VPS IP
- [ ] `my.logicinbound.com` A record points to VPS IP
- [ ] DNS propagation complete (check with `dig` or `nslookup`)

### 2. VPS Requirements
- [ ] Ubuntu 20.04+ or similar Linux distribution
- [ ] Minimum 2GB RAM (4GB recommended)
- [ ] Minimum 20GB disk space
- [ ] Root or sudo access
- [ ] Ports 80, 443, 3000, 3001, 5432 available

### 3. Software Prerequisites
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Git installed (optional, for updates)

## Deployment Steps

### Step 1: Upload Application Files

**Option A: Using SCP**
```bash
# From your local machine
scp unified-ops-platform.tar.gz root@your-vps-ip:/opt/
ssh root@your-vps-ip
cd /opt
tar -xzf unified-ops-platform.tar.gz
```

**Option B: Using Git**
```bash
ssh root@your-vps-ip
cd /opt
git clone <your-repo-url> unified-ops-platform
```

**Option C: Manual Upload**
- Use SFTP client (FileZilla, WinSCP, etc.)
- Upload to `/opt/unified-ops-platform`

### Step 2: Run Quick Start Script

```bash
cd /opt/unified-ops-platform
sudo bash quick-start.sh
```

This script will:
- ✅ Install Docker and Docker Compose (if needed)
- ✅ Generate secure random secrets
- ✅ Create .env configuration
- ✅ Build and start all containers
- ✅ Initialize database

### Step 3: Verify Deployment

```bash
# Check all services are running
sudo docker-compose ps

# Expected output:
# NAME                     STATUS
# unified-ops-backend      Up (healthy)
# unified-ops-frontend     Up (healthy)
# unified-ops-db           Up (healthy)
# unified-ops-nginx        Up

# Check logs for errors
sudo docker-compose logs -f
```

### Step 4: Test Access

**Local Test (from VPS):**
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}

curl http://localhost:3000
# Should return HTML
```

**Domain Test (from browser):**
- Navigate to `http://sitepandaseo.com/login`
- Navigate to `http://ducrm.com/login`
- Navigate to `http://my.logicinbound.com/login`

### Step 5: First Login

1. Open browser: `http://sitepandaseo.com/login`
2. Login with default credentials:
   - Email: `admin@unified-ops.com`
   - Password: `Admin123!`
3. **IMMEDIATELY change password** in user settings

### Step 6: SSL/HTTPS Setup (Recommended)

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Stop Nginx container temporarily
cd /opt/unified-ops-platform
sudo docker-compose stop nginx

# Get SSL certificates
sudo certbot certonly --standalone -d sitepandaseo.com -d www.sitepandaseo.com
sudo certbot certonly --standalone -d ducrm.com -d www.ducrm.com
sudo certbot certonly --standalone -d my.logicinbound.com

# Certificates will be saved to:
# /etc/letsencrypt/live/sitepandaseo.com/
# /etc/letsencrypt/live/ducrm.com/
# /etc/letsencrypt/live/my.logicinbound.com/

# Update Nginx configuration to use SSL
# Edit: deployment/nginx/conf.d/unified-ops.conf
# Add SSL server blocks (see DEPLOYMENT.md for examples)

# Restart Nginx
sudo docker-compose start nginx
```

### Step 7: Configure Firewall (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

## Post-Deployment Configuration

### 1. Create Additional Users

**Via Database:**
```bash
sudo docker-compose exec postgres psql -U unified_ops_user -d unified_ops_platform

-- Create user (generate password hash with bcrypt)
INSERT INTO users (email, password_hash, full_name, is_active)
VALUES ('user@example.com', '$2a$10$...', 'User Name', TRUE);

-- Grant organization access
INSERT INTO user_organization_roles (user_id, organization_id, role)
VALUES (
  (SELECT id FROM users WHERE email = 'user@example.com'),
  (SELECT id FROM organizations WHERE slug = 'sitepanda'),
  'member'
);
```

### 2. Configure Organization Branding

```sql
-- Update organization colors and logo
UPDATE organizations 
SET 
  logo_url = 'https://your-cdn.com/sitepanda-logo.png',
  primary_color = '#3B82F6',
  secondary_color = '#10B981'
WHERE slug = 'sitepanda';
```

### 3. Set Up Integrations

Navigate to each organization's integration page:
- `https://sitepandaseo.com/integrations`
- `https://ducrm.com/integrations`
- `https://my.logicinbound.com/integrations`

Configure:
- [ ] GoHighLevel API keys
- [ ] Google Calendar OAuth
- [ ] NiftyPM API keys
- [ ] Teamwork API keys
- [ ] Custom webhooks

### 4. Configure Automatic Backups

```bash
# Create backup directory
sudo mkdir -p /backups/unified-ops

# Add to crontab
sudo crontab -e

# Add this line (daily backup at 2 AM):
0 2 * * * cd /opt/unified-ops-platform && docker-compose exec -T postgres pg_dump -U unified_ops_user unified_ops_platform > /backups/unified-ops/backup_$(date +\%Y\%m\%d).sql

# Add this line (weekly cleanup - keep last 30 days):
0 3 * * 0 find /backups/unified-ops -name "backup_*.sql" -mtime +30 -delete
```

### 5. Set Up Monitoring (Optional)

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# View container stats
sudo docker stats

# Set up log rotation
sudo nano /etc/logrotate.d/unified-ops
```

Add to logrotate config:
```
/opt/unified-ops-platform/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
}
```

## Security Hardening Checklist

- [ ] Changed default admin password
- [ ] Generated strong JWT secrets
- [ ] Configured firewall (UFW)
- [ ] Enabled SSL/HTTPS
- [ ] Set up automatic security updates
- [ ] Configured fail2ban (optional)
- [ ] Restricted database access to localhost only
- [ ] Enabled Docker security features
- [ ] Regular backup schedule configured
- [ ] Log monitoring set up

### Enable Automatic Security Updates

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### Install Fail2Ban (Optional)

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Maintenance Tasks

### Daily
- [ ] Check application logs: `sudo docker-compose logs --tail=100`
- [ ] Verify all services running: `sudo docker-compose ps`

### Weekly
- [ ] Review integration logs for errors
- [ ] Check disk space: `df -h`
- [ ] Review user activity logs

### Monthly
- [ ] Update Docker images: `sudo docker-compose pull`
- [ ] Rebuild containers: `sudo docker-compose up -d --build`
- [ ] Review and rotate logs
- [ ] Test backup restoration
- [ ] Security audit

## Troubleshooting

### Services Won't Start

```bash
# Check logs
sudo docker-compose logs

# Check if ports are in use
sudo netstat -tulpn | grep -E '3000|3001|5432|80|443'

# Restart services
sudo docker-compose restart
```

### Database Connection Issues

```bash
# Check database is running
sudo docker-compose ps postgres

# Test connection
sudo docker-compose exec postgres psql -U unified_ops_user -d unified_ops_platform -c "SELECT 1;"

# Check database logs
sudo docker-compose logs postgres
```

### Cannot Access via Domain

```bash
# Check DNS resolution
dig sitepandaseo.com
nslookup sitepandaseo.com

# Check Nginx is running
sudo docker-compose ps nginx

# Check Nginx logs
sudo docker-compose logs nginx

# Test locally
curl -H "Host: sitepandaseo.com" http://localhost
```

### High Memory Usage

```bash
# Check container stats
sudo docker stats

# Restart specific service
sudo docker-compose restart backend

# Increase container resources in docker-compose.yml
```

## Rollback Procedure

If something goes wrong:

```bash
# Stop all services
cd /opt/unified-ops-platform
sudo docker-compose down

# Restore from backup
sudo docker-compose up -d postgres
sudo docker-compose exec -T postgres psql -U unified_ops_user -d unified_ops_platform < /backups/unified-ops/backup_YYYYMMDD.sql

# Restart all services
sudo docker-compose up -d
```

## Support Contacts

- **System Administrator:** [Your contact info]
- **Technical Support:** [Your support email]
- **Emergency Contact:** [Your emergency contact]

## Useful Commands Reference

```bash
# View all logs
sudo docker-compose logs -f

# View specific service logs
sudo docker-compose logs -f backend

# Restart all services
sudo docker-compose restart

# Restart specific service
sudo docker-compose restart backend

# Stop all services
sudo docker-compose down

# Start all services
sudo docker-compose up -d

# Rebuild and restart
sudo docker-compose up -d --build

# Check service status
sudo docker-compose ps

# Access database
sudo docker-compose exec postgres psql -U unified_ops_user -d unified_ops_platform

# Backup database
sudo docker-compose exec postgres pg_dump -U unified_ops_user unified_ops_platform > backup.sql

# Restore database
sudo docker-compose exec -T postgres psql -U unified_ops_user -d unified_ops_platform < backup.sql

# Clean up Docker
sudo docker system prune -a

# View container resource usage
sudo docker stats
```

## Deployment Complete! 🎉

Your Unified Operations Platform is now deployed and ready for use.

**Next Steps:**
1. Login and change default password
2. Create user accounts for your team
3. Configure integrations
4. Import existing data (if any)
5. Customize organization branding
6. Set up monitoring and alerts

**Remember:**
- Keep your `.env` file secure
- Regular backups are critical
- Monitor logs for issues
- Keep Docker images updated
- Review security settings periodically

---

**For detailed information, refer to:**
- [README.md](./README.md) - Project overview
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
- [Database Schema](./database/schema.sql) - Database structure

**Deployment Date:** _________________
**Deployed By:** _________________
**VPS IP:** _________________

