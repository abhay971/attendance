# Deployment Guide - Attendance Tracking System

## Quick Start - Deploy in 10 Minutes

### Option 1: Railway (Recommended - Easiest) ⭐

**Cost:** $5/month for hobby plan (includes database)

#### Backend Deployment:
1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository and choose the `server` folder
4. Railway will auto-detect Node.js
5. Click "Add PostgreSQL" to add database
6. Add environment variables:
   ```
   NODE_ENV=production
   JWT_ACCESS_SECRET=<generate-32-char-random-string>
   JWT_REFRESH_SECRET=<generate-different-32-char-random-string>
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```
   Note: DATABASE_URL is auto-set by Railway
7. Go to Settings → Generate Domain to get your API URL
8. Run migrations: In deployments, add command `npx prisma migrate deploy`
9. Seed admin user: Run `npm run seed` once

#### Frontend Deployment:
1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "New Project" → Import your GitHub repo
3. Select `attendance` folder as root directory
4. Add environment variable:
   ```
   VITE_API_URL=https://your-railway-backend.up.railway.app/api
   ```
5. Deploy!

**Total Time:** ~10 minutes
**Total Cost:** $5/month (Railway) + Free (Vercel)

---

### Option 2: Render

**Cost:** $7/month for starter plan

#### Backend:
1. Go to [render.com](https://render.com)
2. Create "New Web Service"
3. Connect GitHub repo, select `server` folder
4. Settings:
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npm start`
5. Add PostgreSQL database (click "New PostgreSQL")
6. Set environment variables (same as Railway)
7. Deploy

#### Frontend:
Same as Vercel above, or use Netlify

---

### Option 3: VPS (DigitalOcean/AWS/Linode)

**For Advanced Users - Full Control**

**Cost:** ~$6-12/month

See [SECURITY.md](./SECURITY.md) for detailed VPS deployment instructions.

---

## Environment Variables Reference

### Backend (.env)
```bash
# Required
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_ACCESS_SECRET="your-32-char-secret"  # Generate: openssl rand -base64 32
JWT_REFRESH_SECRET="your-different-32-char-secret"
NODE_ENV="production"

# Optional
PORT=3000
CORS_ORIGIN="https://your-frontend-domain.com"  # Your frontend URL
```

### Frontend (.env.production)
```bash
VITE_API_URL="https://your-backend-api.com/api"
```

---

## Pre-Deployment Checklist

### Backend
- [ ] Set strong JWT secrets (min 32 characters each)
- [ ] Configure production database
- [ ] Set NODE_ENV=production
- [ ] Set CORS_ORIGIN to frontend URL
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed admin user: `npm run seed`
- [ ] Test health endpoint: `curl https://your-api.com/health`

### Frontend
- [ ] Update VITE_API_URL to production backend
- [ ] Build and test locally: `npm run build && npm run preview`
- [ ] Verify all API calls work

---

## Post-Deployment Steps

### 1. Create Admin Account
If you haven't run the seed script, create admin manually:

**Default credentials (from seed):**
- Email: `admin@attendance.com`
- Password: `admin123`

⚠️ **IMPORTANT:** Change this password immediately after first login!

### 2. Test the Application
1. Visit your frontend URL
2. Login with admin credentials
3. Create a test employee
4. Test check-in/check-out functionality
5. Verify all admin features work

### 3. Setup Monitoring
Recommended free tools:
- **Uptime Monitoring:** [UptimeRobot](https://uptimerobot.com)
- **Error Tracking:** [Sentry](https://sentry.io) (free tier)
- **Performance:** [New Relic](https://newrelic.com) (free tier)

### 4. Enable Backups
- Railway: Automatic daily backups included
- Render: Enable in PostgreSQL settings
- VPS: Setup cron job for pg_dump

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
railway logs  # for Railway
render logs   # for Render

# Common issues:
# 1. Missing environment variables - Check all required vars are set
# 2. Database not connected - Verify DATABASE_URL
# 3. Port conflicts - Railway/Render auto-assign ports
```

### Frontend can't connect to backend
```bash
# 1. Check VITE_API_URL is correct
echo $VITE_API_URL

# 2. Verify CORS is configured correctly
# Backend CORS_ORIGIN should match frontend domain

# 3. Test API endpoint
curl https://your-backend.com/health
```

### CORS errors
```bash
# Backend .env must have:
CORS_ORIGIN="https://your-exact-frontend-domain.com"

# Don't use wildcards (*) in production!
```

### 429 Too Many Requests
This means rate limiting is working! Default limits:
- Global: 100 requests / 15 minutes
- Login: 5 attempts / 15 minutes

Adjust in `server/src/app.ts` if needed.

---

## Database Management

### Run Migrations
```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

### Seed Database
```bash
npm run seed
```

### View Database
```bash
npx prisma studio
```

### Backup Database
```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

---

## Scaling Considerations

### When to scale:
- More than 100 concurrent users
- High traffic during peak hours
- Database response times > 200ms

### How to scale:

**Horizontal Scaling:**
1. Add load balancer
2. Deploy multiple backend instances
3. Use Redis for session storage (currently using JWT, no session storage needed)

**Database Scaling:**
1. Add read replicas
2. Implement connection pooling (PgBouncer)
3. Add database indexes for slow queries

**Frontend Scaling:**
1. Use CDN for static assets (Vercel/Netlify do this automatically)
2. Enable caching headers
3. Optimize images and code splitting

---

## Security Best Practices

### Essential (Do Before Going Live)
- [ ] Change default admin password
- [ ] Use HTTPS everywhere (automatic with Vercel/Railway)
- [ ] Set strong JWT secrets (min 32 chars)
- [ ] Enable rate limiting (already configured)
- [ ] Review CORS settings

### Recommended
- [ ] Setup error monitoring
- [ ] Enable database backups
- [ ] Implement log rotation
- [ ] Regular security audits: `npm audit`
- [ ] Keep dependencies updated

### Advanced
- [ ] Setup WAF (Web Application Firewall)
- [ ] Implement DDoS protection (Cloudflare)
- [ ] Add IP whitelisting for admin panel
- [ ] Enable 2FA for admin accounts
- [ ] Regular penetration testing

---

## Cost Comparison

### Hobby/Side Project
**Railway + Vercel**
- Backend: $5/month (Railway Hobby)
- Frontend: Free (Vercel)
- Total: **$5/month**

### Small Business
**Render + Netlify**
- Backend: $7/month (Render Starter)
- Frontend: Free (Netlify)
- Total: **$7/month**

### Growing Business
**DigitalOcean Droplet**
- VPS: $12/month (2GB RAM)
- Managed DB: $15/month
- Total: **$27/month**

### Enterprise
**AWS**
- EC2: ~$30/month
- RDS: ~$50/month
- Load Balancer: ~$20/month
- Total: **~$100/month**

---

## Getting Help

### Check logs first:
```bash
# Railway
railway logs

# Render
render logs

# PM2 (VPS)
pm2 logs attendance-api

# Docker
docker logs <container-id>
```

### Common Issues & Solutions:
See [SECURITY.md](./SECURITY.md) for detailed troubleshooting

---

## Recommended Deployment

For most users: **Railway (Backend) + Vercel (Frontend)**

**Pros:**
- ✅ Easiest setup (10 minutes)
- ✅ Auto-deploys from GitHub
- ✅ Free SSL certificates
- ✅ Built-in monitoring
- ✅ Automatic backups
- ✅ $5/month total

**Cons:**
- ⚠️ Not the cheapest for high traffic
- ⚠️ Limited customization

---

## Next Steps After Deployment

1. **Customize branding:** Update colors, logo, company name
2. **Add features:** Implement your specific requirements
3. **Integrate services:** Email notifications, SMS alerts, etc.
4. **Monitor usage:** Setup analytics and tracking
5. **Gather feedback:** Get user input for improvements

---

**Need help?** Check [SECURITY.md](./SECURITY.md) for detailed setup guides.
