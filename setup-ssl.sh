#!/bin/bash

#########################################
# SSL Certificate Setup Script
#########################################

set -e

echo "Setting up SSL certificates..."
echo ""
echo "IMPORTANT: Make sure your DNS records are configured first!"
echo "All domains should point to: 104.225.223.44"
echo ""
read -p "Have you configured DNS? (yes/no): " dns_ready

if [ "$dns_ready" != "yes" ]; then
    echo "Please configure DNS first, then run this script again."
    exit 1
fi

echo ""
echo "Installing SSL certificates..."
echo ""

# Install certificate for SitePanda
echo "1/3: Installing SSL for sitepandaseo.com..."
certbot --nginx -d sitepandaseo.com -d www.sitepandaseo.com --non-interactive --agree-tos --email admin@sitepandaseo.com --redirect

# Install certificate for Decisions Unlimited
echo "2/3: Installing SSL for ducrm.com..."
certbot --nginx -d ducrm.com -d www.ducrm.com --non-interactive --agree-tos --email admin@ducrm.com --redirect

# Install certificate for Logic Inbound
echo "3/3: Installing SSL for my.logicinbound.com..."
certbot --nginx -d my.logicinbound.com --non-interactive --agree-tos --email admin@logicinbound.com --redirect

# Test auto-renewal
echo ""
echo "Testing certificate auto-renewal..."
certbot renew --dry-run

echo ""
echo "✓ SSL certificates installed successfully!"
echo ""
echo "Your sites are now secured with HTTPS:"
echo "  - https://sitepandaseo.com"
echo "  - https://ducrm.com"
echo "  - https://my.logicinbound.com"
echo ""
echo "Certificates will auto-renew every 90 days."

