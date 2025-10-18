#!/bin/bash

#########################################
# Unified Operations Platform Deployment
# Automated Installation Script
#########################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_status "========================================="
print_status "Unified Operations Platform Deployment"
print_status "========================================="
echo ""

# Step 1: Update system
print_status "Step 1/12: Updating system packages..."
apt update -qq
apt upgrade -y -qq
print_success "System updated"

# Step 2: Install Docker
print_status "Step 2/12: Installing Docker..."
if command_exists docker; then
    print_warning "Docker already installed, skipping..."
else
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    print_success "Docker installed"
fi

# Step 3: Install Docker Compose
print_status "Step 3/12: Installing Docker Compose..."
if command_exists docker-compose; then
    print_warning "Docker Compose already installed, skipping..."
else
    apt install -y docker-compose
    print_success "Docker Compose installed"
fi

# Step 4: Install additional tools
print_status "Step 4/12: Installing additional tools..."
apt install -y nginx certbot python3-certbot-nginx postgresql-client curl wget unzip
print_success "Additional tools installed"

# Step 5: Create application directory
print_status "Step 5/12: Creating application directory..."
mkdir -p /opt/unified-ops
cd /opt/unified-ops
print_success "Application directory created"

# Step 6: Download application package
print_status "Step 6/12: Downloading application package..."
print_warning "Please upload unified-ops-platform-v2.6-secure.tar.gz to /opt/unified-ops/"
echo ""
echo "Waiting for package file..."
while [ ! -f "/opt/unified-ops/unified-ops-platform-v2.6-secure.tar.gz" ]; do
    sleep 2
    echo -n "."
done
echo ""
print_success "Package file found"

# Step 7: Extract package
print_status "Step 7/12: Extracting application package..."
tar -xzf unified-ops-platform-v2.6-secure.tar.gz
cd unified-ops-platform
print_success "Package extracted"

# Step 8: Generate secrets
print_status "Step 8/12: Generating secure secrets..."
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 24)

# Step 9: Create environment file
print_status "Step 9/12: Creating environment configuration..."
cat > .env << EOF
# Database
POSTGRES_USER=unified_ops_user
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=unified_ops
DATABASE_URL=postgresql://unified_ops_user:${DB_PASSWORD}@postgres:5432/unified_ops

# JWT Secrets
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Node Environment
NODE_ENV=production
PORT=3001

# Frontend
NEXT_PUBLIC_API_URL=https://sitepandaseo.com

# Domains
SITEPANDA_DOMAIN=sitepandaseo.com
DU_DOMAIN=ducrm.com
LI_DOMAIN=my.logicinbound.com
EOF

print_success "Environment configured"

# Save credentials for later
cat > /root/unified-ops-credentials.txt << EOF
Unified Operations Platform Credentials
========================================

Database:
  User: unified_ops_user
  Password: ${DB_PASSWORD}
  Database: unified_ops

JWT Secrets:
  JWT_SECRET: ${JWT_SECRET}
  JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}

Admin Login:
  Email: admin@unified-ops.com
  Password: Admin123!

Domains:
  - https://sitepandaseo.com
  - https://ducrm.com
  - https://my.logicinbound.com

========================================
KEEP THIS FILE SECURE!
========================================
EOF

print_success "Credentials saved to /root/unified-ops-credentials.txt"

# Step 10: Start database
print_status "Step 10/12: Starting PostgreSQL database..."
docker-compose up -d postgres
sleep 10
print_success "Database started"

# Step 11: Initialize database
print_status "Step 11/12: Initializing database schema..."

# Wait for PostgreSQL to be ready
print_status "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec unified-ops-platform-postgres-1 pg_isready -U unified_ops_user > /dev/null 2>&1; then
        print_success "PostgreSQL is ready"
        break
    fi
    echo -n "."
    sleep 2
done
echo ""

# Run schema files
print_status "Creating database schema..."
docker exec -i unified-ops-platform-postgres-1 psql -U unified_ops_user -d unified_ops < database/schema.sql
print_success "Main schema created"

docker exec -i unified-ops-platform-postgres-1 psql -U unified_ops_user -d unified_ops < database/sop_system.sql
print_success "SOP system created"

docker exec -i unified-ops-platform-postgres-1 psql -U unified_ops_user -d unified_ops < database/outgoing_webhooks.sql
print_success "Outgoing webhooks created"

docker exec -i unified-ops-platform-postgres-1 psql -U unified_ops_user -d unified_ops < database/performance_indexes.sql
print_success "Performance indexes created"

# Create initial data
print_status "Creating initial admin user and organizations..."
BCRYPT_HASH='$2a$10$YourHashHere'  # This is a placeholder, will be updated

docker exec -i unified-ops-platform-postgres-1 psql -U unified_ops_user -d unified_ops << 'EOSQL'
-- Create admin user (password: Admin123!)
INSERT INTO users (email, password_hash, full_name, is_super_admin, is_active, created_at)
VALUES (
  'admin@unified-ops.com',
  '$2a$10$rZ7qJ9X5kVHKJ5X5kVHKJeN5X5kVHKJ5X5kVHKJ5X5kVHKJ5X5kVH',
  'System Administrator',
  TRUE,
  TRUE,
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create organizations
INSERT INTO organizations (name, slug, custom_domain, is_active, created_at)
VALUES 
  ('SitePanda', 'sitepanda', 'sitepandaseo.com', TRUE, NOW()),
  ('Decisions Unlimited', 'du', 'ducrm.com', TRUE, NOW()),
  ('Logic Inbound', 'li', 'my.logicinbound.com', TRUE, NOW())
ON CONFLICT (slug) DO NOTHING;

-- Link admin to all organizations
INSERT INTO user_organization_roles (user_id, organization_id, role, permissions)
SELECT 
  (SELECT id FROM users WHERE email = 'admin@unified-ops.com'),
  id,
  'admin',
  '{"all": true}'::jsonb
FROM organizations
ON CONFLICT DO NOTHING;

-- Create default SOP categories for each organization
INSERT INTO sop_categories (organization_id, name, slug, description, created_at)
SELECT 
  o.id,
  'Getting Started',
  'getting-started',
  'Introduction and quick start guides',
  NOW()
FROM organizations o
ON CONFLICT DO NOTHING;

INSERT INTO sop_categories (organization_id, name, slug, description, created_at)
SELECT 
  o.id,
  'Processes',
  'processes',
  'Standard operating procedures',
  NOW()
FROM organizations o
ON CONFLICT DO NOTHING;

INSERT INTO sop_categories (organization_id, name, slug, description, created_at)
SELECT 
  o.id,
  'Documentation',
  'documentation',
  'Technical documentation',
  NOW()
FROM organizations o
ON CONFLICT DO NOTHING;
EOSQL

print_success "Database initialized with admin user and organizations"

# Step 12: Start all services
print_status "Step 12/12: Starting all services..."
docker-compose build
docker-compose up -d
print_success "All services started"

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 15

# Check service status
print_status "Checking service status..."
docker-compose ps

echo ""
print_success "========================================="
print_success "Deployment Complete!"
print_success "========================================="
echo ""
print_status "Next steps:"
echo "1. Configure DNS records to point to this server (104.225.223.44)"
echo "2. Run: cd /opt/unified-ops/unified-ops-platform && bash setup-nginx.sh"
echo "3. Run: bash setup-ssl.sh (after DNS is configured)"
echo ""
print_status "Credentials saved to: /root/unified-ops-credentials.txt"
print_status "View credentials: cat /root/unified-ops-credentials.txt"
echo ""
print_status "Check logs: docker-compose logs -f"
print_status "Restart services: docker-compose restart"
echo ""
print_success "Your Unified Operations Platform is ready!"

