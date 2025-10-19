# Unified Ops Platform - Deployment & Troubleshooting Guide

## Quick Deployment Checklist

### Before Deploying
- [ ] Test build locally first (`npm run build` in frontend directory)
- [ ] Verify CSS is generated correctly (check `.next/static/css/`)
- [ ] Check that Tailwind utility classes are present in compiled CSS
- [ ] Ensure PostCSS config exists (`postcss.config.js`)
- [ ] Verify Tailwind config content paths match file structure

### Deployment Steps
1. **Test locally in sandbox**
   ```bash
   cd /home/ubuntu/unified-ops-platform/frontend
   npm install
   npm run build
   # Check if build succeeds and CSS is generated
   ```

2. **Copy files to production**
   ```bash
   scp -r frontend/app root@SERVER:/opt/unified-ops/unified-ops-platform/frontend/
   ```

3. **Rebuild and restart**
   ```bash
   ssh root@SERVER "cd /opt/unified-ops/unified-ops-platform && \
     docker compose build --no-cache frontend && \
     docker compose up -d frontend"
   ```

4. **Verify deployment**
   ```bash
   # Check HTML structure
   curl -s https://m.kyleroelofs.com/login | grep "gradient-surface"
   
   # Check CSS file
   curl -s https://m.kyleroelofs.com/_next/static/css/*.css | grep "\.flex{"
   ```

## Common Issues & Solutions

### Issue 1: UI Not Displaying Correctly (Layout Broken)

**Symptoms:**
- Dark background shows but content not centered
- Flexbox layout not working
- Spacing and sizing off

**Root Cause:** Tailwind utility classes not generated in CSS bundle

**Diagnosis:**
```bash
# Check if utility classes exist in CSS
curl -s https://m.kyleroelofs.com/_next/static/css/*.css | grep -E "\.flex\{|\.items-center\{|\.min-h-screen\{"

# If no output, utilities are missing
```

**Solution:**
1. Ensure `postcss.config.js` exists:
   ```javascript
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   }
   ```

2. Verify `tailwind.config.js` content paths:
   ```javascript
   content: [
     './pages/**/*.{js,ts,jsx,tsx,mdx}',
     './components/**/*.{js,ts,jsx,tsx,mdx}',
     './app/**/*.{js,ts,jsx,tsx,mdx}',
   ]
   ```

3. Clear `.next` cache and rebuild:
   ```bash
   rm -rf frontend/.next
   docker compose build --no-cache frontend
   ```

### Issue 2: Login API Returns 400 Error

**Symptoms:**
- Login form submits but returns 400 Bad Request
- Backend logs show rate limiter errors

**Root Cause:** Express not trusting proxy headers from Nginx

**Solution:**
Add to `backend/src/server.js` (after `const app = express();`):
```javascript
app.set('trust proxy', true);
```

Then rebuild backend:
```bash
docker compose build backend && docker compose up -d backend
```

### Issue 3: Changes Not Appearing After Deployment

**Diagnosis Steps:**
1. **Check if files were copied:**
   ```bash
   ssh root@SERVER "cat /opt/unified-ops/unified-ops-platform/frontend/app/login/page.tsx | head -20"
   ```

2. **Check if container rebuilt:**
   ```bash
   ssh root@SERVER "docker images | grep frontend"
   # Look at the creation time
   ```

3. **Check what's being served:**
   ```bash
   curl -s https://m.kyleroelofs.com/login | head -100
   ```

**Common Causes:**
- Docker using cached layers (use `--no-cache`)
- Browser caching (hard refresh: Ctrl+Shift+R)
- Nginx caching (restart nginx if configured with cache)
- Wrong file copied (verify source file is correct)

### Issue 4: Frontend Container Unhealthy

**Check logs:**
```bash
docker logs unified-ops-frontend --tail 50
```

**Common causes:**
- Port 3000 already in use
- Build failed but container started anyway
- Missing environment variables
- Node.js out of memory

## Efficient Debugging Workflow

### Step 1: Identify Problem Category (5 minutes)
Ask these questions:
- **Code problem?** - Syntax error, wrong logic
- **Build problem?** - CSS not generated, compilation failed
- **Deployment problem?** - Files not copied, container not restarted
- **Cache problem?** - Browser or CDN showing old version

### Step 2: Gather Evidence (5 minutes)
```bash
# What's in the source code?
cat /path/to/file.tsx

# What's deployed on server?
ssh root@SERVER "cat /opt/unified-ops/.../file.tsx"

# What's being served to browser?
curl -s https://m.kyleroelofs.com/page

# What CSS is loaded?
curl -s https://m.kyleroelofs.com/_next/static/css/*.css | head -100

# Container status
docker ps
docker logs container-name --tail 50
```

### Step 3: Test Fix Locally (10 minutes)
```bash
cd /home/ubuntu/unified-ops-platform/frontend
npm run build

# Check if build succeeds
# Check if CSS contains expected classes
grep "gradient-surface" .next/static/css/*.css
```

### Step 4: Deploy Once (5 minutes)
Only deploy after confirming fix works locally

### Step 5: Verify (2 minutes)
Check if the issue is resolved. If not, return to Step 1 with new information.

## Time-Saving Tips

### 1. Use SSH Keys (No Password Prompts)
```bash
# On local machine
ssh-keygen -t ed25519
ssh-copy-id root@SERVER

# Now SSH works without password
ssh root@SERVER "docker ps"
```

### 2. Create Deployment Script
```bash
#!/bin/bash
# deploy.sh
set -e

echo "Building locally first..."
cd frontend && npm run build && cd ..

echo "Copying files..."
scp -r frontend/app root@SERVER:/opt/unified-ops/unified-ops-platform/frontend/

echo "Rebuilding on server..."
ssh root@SERVER "cd /opt/unified-ops/unified-ops-platform && \
  docker compose build frontend && \
  docker compose up -d frontend"

echo "Checking status..."
ssh root@SERVER "docker ps | grep frontend"

echo "Done! Check https://m.kyleroelofs.com"
```

### 3. Quick CSS Check Alias
Add to `.bashrc`:
```bash
alias check-css='curl -s https://m.kyleroelofs.com/_next/static/css/*.css | grep -E "\.flex\{|\.items-center\{|\.gradient-surface\{"'
```

## Production Server Details

- **Server IP:** 104.225.223.44
- **Project Path:** `/opt/unified-ops/unified-ops-platform`
- **Frontend Container:** `unified-ops-frontend`
- **Backend Container:** `unified-ops-backend`
- **Database Container:** `unified-ops-db`
- **Domain:** https://m.kyleroelofs.com

## Emergency Rollback

If deployment breaks production:
```bash
# Check recent images
docker images | grep frontend

# Rollback to previous image
docker tag OLD_IMAGE_ID unified-ops-platform-frontend:latest
docker compose up -d frontend
```

## Best Practices

1. **Always test locally before deploying to production**
2. **Use `--no-cache` when CSS/config changes are made**
3. **Verify what's actually deployed, don't assume**
4. **Check logs immediately after deployment**
5. **If something fails 2-3 times, stop and diagnose differently**
6. **Document what worked for future reference**

## Lessons Learned

### Case Study: Login Page Layout Issue (Oct 2025)

**Problem:** Login page showed dark background but content wasn't centered, emoji missing, layout broken.

**What We Tried (Inefficiently):**
- Multiple rebuilds hoping it would fix itself
- Clearing browser cache repeatedly
- Copying files multiple times
- Restarting containers many times

**What We Should Have Done:**
1. Check compiled CSS first (would have found missing utility classes immediately)
2. Verify PostCSS config exists
3. Test build locally
4. Deploy once after confirming fix

**Time Spent:** 2+ hours  
**Time Needed With Better Approach:** 20-30 minutes

**Key Insight:** We treated a build configuration problem as a deployment problem, leading to many unnecessary rebuild cycles.

---

*Last Updated: October 2025*
*Maintainer: Kyle Roelofs*

