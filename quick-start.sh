#!/bin/bash

# Unified Operations Platform - Quick Start Script
# This script helps you quickly set up the platform on your VPS

set -e

echo "🚀 Unified Operations Platform - Quick Start"
echo "============================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "⚠️  Please run as root or with sudo"
  exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    
    # Generate random secrets
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    SESSION_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    # Update .env file
    sed -i "s/CHANGE_THIS_TO_SECURE_PASSWORD/$DB_PASSWORD/" .env
    sed -i "s/CHANGE_THIS_TO_RANDOM_32_CHAR_STRING/$JWT_SECRET/" .env
    sed -i "s/CHANGE_THIS_TO_ANOTHER_RANDOM_32_CHAR_STRING/$JWT_REFRESH_SECRET/" .env
    sed -i "s/CHANGE_THIS_TO_RANDOM_SESSION_SECRET/$SESSION_SECRET/" .env
    
    echo "✅ .env file created with random secrets"
else
    echo "✅ .env file already exists"
fi

# Copy .env to backend directory
cp .env backend/.env

echo ""
echo "🏗️  Building and starting containers..."
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
else
    echo "❌ Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi

echo ""
echo "============================================"
echo "✅ Unified Operations Platform is ready!"
echo "============================================"
echo ""
echo "📍 Access your platform at:"
echo "   - http://localhost:3000 (local)"
echo "   - https://sitepandaseo.com/login"
echo "   - https://ducrm.com/login"
echo "   - https://my.logicinbound.com/login"
echo ""
echo "🔐 Default credentials:"
echo "   Email: admin@unified-ops.com"
echo "   Password: Admin123!"
echo ""
echo "⚠️  IMPORTANT: Change the default password after first login!"
echo ""
echo "📊 Useful commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart:       docker-compose restart"
echo "   Status:        docker-compose ps"
echo ""
echo "📚 For more information, see README.md and DEPLOYMENT.md"
echo ""

