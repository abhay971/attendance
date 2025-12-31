# Security & Deployment Guide

## Security Features Implemented

### 1. Authentication & Authorization
- ✅ JWT-based authentication with access and refresh tokens
- ✅ HttpOnly cookies for refresh tokens (prevents XSS attacks)
- ✅ Secure cookies in production (HTTPS only)
- ✅ SameSite: strict cookies (prevents CSRF attacks)
- ✅ Role-based access control (ADMIN/EMPLOYEE)
- ✅ Token expiration (15 min access, 7 days refresh)

### 2. Password Security
- ✅ Bcrypt hashing with 12 salt rounds
- ✅ Minimum 6 character password requirement
- ✅ Password not returned in API responses

### 3. Rate Limiting
- ✅ Global rate limit: 100 requests per 15 minutes
- ✅ Login rate limit: 5 attempts per 15 minutes (prevents brute force)

### 4. Security Headers
- ✅ Helmet middleware for secure HTTP headers
- ✅ Content Security Policy (CSP) in production
- ✅ X-Frame-Options, X-Content-Type-Options, etc.

### 5. Input Validation
- ✅ Zod schema validation on all inputs
- ✅ Prisma parameterized queries (prevents SQL injection)
- ✅ Request body size limit (1MB max)

### 6. Database Security
- ✅ Prisma ORM with parameterized queries
- ✅ User passwords hashed before storage
- ✅ Cascade deletion configured properly

### 7. Error Handling
- ✅ Generic error messages in production (prevents information disclosure)
- ✅ Detailed errors only in development
- ✅ Proper logging without sensitive data

## Pre-Deployment Checklist

### Backend
- [ ] Set strong JWT secrets (minimum 32 characters)
- [ ] Configure production database connection
- [ ] Set NODE_ENV=production
- [ ] Set CORS_ORIGIN to your frontend domain
- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Seed initial admin user: `npm run seed`
- [ ] Test all API endpoints
- [ ] Enable HTTPS/SSL certificate
- [ ] Configure firewall rules
- [ ] Setup monitoring and logging

### Frontend
- [ ] Update VITE_API_URL to production backend URL
- [ ] Build production bundle: `npm run build`
- [ ] Test production build locally
- [ ] Configure CDN for static assets (optional)
- [ ] Enable HTTPS/SSL certificate

### Security
- [ ] Review and rotate all secrets
- [ ] Enable database backups
- [ ] Setup error monitoring (e.g., Sentry)
- [ ] Configure log rotation
- [ ] Review user permissions
- [ ] Plan disaster recovery

## Deployment Options

### Option 1: Traditional VPS (Recommended for Full Control)

**Platforms:** DigitalOcean, AWS EC2, Linode, Vultr

**Backend Deployment:**
```bash
# 1. Setup server (Ubuntu 22.04 LTS recommended)
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# 4. Clone and setup your code
git clone <your-repo>
cd server
npm install
cp .env.production.example .env
# Edit .env with your production values

# 5. Run migrations and seed
npx prisma migrate deploy
npm run seed

# 6. Install PM2 for process management
sudo npm install -g pm2
pm2 start npm --name "attendance-api" -- start
pm2 save
pm2 startup

# 7. Setup Nginx as reverse proxy
sudo apt install nginx -y
# Configure nginx (see nginx.conf example below)

# 8. Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yourdomain.com
```

**Frontend Deployment:**
```bash
# Option A: Serve with Nginx
cd attendance
npm install
npm run build
# Copy dist/ to /var/www/html or nginx root

# Option B: Use CDN (Cloudflare, etc.)
# Upload dist/ to CDN
```

### Option 2: Platform as a Service (Easiest)

**Backend Options:**

**Railway (Recommended - Easiest):**
1. Sign up at https://railway.app
2. Create new project from GitHub repo
3. Add PostgreSQL service
4. Configure environment variables
5. Deploy automatically on git push

**Render:**
1. Sign up at https://render.com
2. Create new Web Service from repo
3. Add PostgreSQL database
4. Set environment variables
5. Auto-deploys from GitHub

**Heroku:**
1. Install Heroku CLI
2. Create new app: `heroku create your-app-name`
3. Add PostgreSQL: `heroku addons:create heroku-postgresql:mini`
4. Set env vars: `heroku config:set NODE_ENV=production`
5. Push: `git push heroku main`

**Frontend Options:**

**Vercel (Recommended for Vite):**
```bash
npm install -g vercel
cd attendance
vercel --prod
```

**Netlify:**
```bash
npm install -g netlify-cli
cd attendance
npm run build
netlify deploy --prod --dir=dist
```

**Cloudflare Pages:**
1. Connect GitHub repo
2. Set build command: `npm run build`
3. Set build output: `dist`
4. Deploy

### Option 3: Containerized Deployment

**Docker Compose:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: attendance
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: ./server
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@db:5432/attendance
      NODE_ENV: production
    depends_on:
      - db
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

Deploy to:
- AWS ECS
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform

## Nginx Configuration Example

```nginx
# /etc/nginx/sites-available/attendance

# API Server
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/attendance/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Recommended Deployment Strategy

### For Production with Budget:
1. **Backend:** Railway ($5/month) or Render ($7/month)
   - Includes PostgreSQL database
   - Auto-scaling
   - Free SSL certificates
   - GitHub integration

2. **Frontend:** Vercel or Netlify (Free tier)
   - Global CDN
   - Auto-deploys from GitHub
   - Free SSL certificates

**Total Cost:** ~$5-7/month

### For Learning/Development:
1. **Backend:** Render Free Tier or Railway Hobby
2. **Frontend:** Vercel/Netlify Free Tier
**Total Cost:** Free (with limitations)

### For High Traffic Production:
1. **Backend:** AWS EC2 or DigitalOcean Droplet with Load Balancer
2. **Database:** Managed PostgreSQL (RDS, DO Managed DB)
3. **Frontend:** Cloudflare Pages + CDN
4. **Monitoring:** DataDog or New Relic

## Post-Deployment

### Monitoring
- Setup uptime monitoring (UptimeRobot, Pingdom)
- Configure error tracking (Sentry)
- Setup log aggregation (Logtail, Papertrail)
- Monitor database performance

### Backups
- Enable automated database backups (daily)
- Test restore procedures monthly
- Keep backups for 30 days minimum

### Maintenance
- Update dependencies regularly: `npm outdated`
- Monitor security advisories: `npm audit`
- Review access logs weekly
- Rotate secrets quarterly

## Support & Issues

If you encounter issues:
1. Check server logs: `pm2 logs attendance-api`
2. Verify environment variables are set correctly
3. Test database connectivity
4. Check firewall and security group rules
5. Verify SSL certificates are valid

## Security Contact

Report security vulnerabilities to: [your-email@domain.com]
