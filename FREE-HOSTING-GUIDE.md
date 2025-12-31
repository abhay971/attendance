# Free Hosting Guide - $0/month Forever! 🎉

## Option 1: Render + Vercel (Recommended) ⭐

**Total Cost:** FREE
**Limitations:**
- Backend spins down after 15 min inactivity (first request takes ~30 seconds to wake up)
- 750 hours/month free tier
- 100GB bandwidth/month

### Step 1: Deploy Backend to Render (FREE)

1. **Sign up at Render**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - Name: `attendance-db`
   - Database: `attendance`
   - User: `attendance_user`
   - Region: Choose closest to you
   - Instance Type: **Free**
   - Click "Create Database"
   - **COPY the Internal Database URL** (you'll need it)

3. **Deploy Backend**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repo → Click "Connect"

   **Configuration:**
   - Name: `attendance-api`
   - Region: Same as database
   - Branch: `main` (or your default branch)
   - Root Directory: `server`
   - Runtime: `Node`
   - Build Command:
     ```
     npm install && npx prisma generate && npx prisma migrate deploy
     ```
   - Start Command:
     ```
     npm start
     ```
   - Instance Type: **Free**

4. **Add Environment Variables**
   Click "Advanced" → Add environment variables:
   ```
   DATABASE_URL = <paste-internal-database-url-from-step-2>
   NODE_ENV = production
   JWT_ACCESS_SECRET = <generate-random-32-char-string>
   JWT_REFRESH_SECRET = <generate-different-random-32-char-string>
   CORS_ORIGIN = https://your-app-name.vercel.app
   ```

   **Generate secrets:**
   - Open terminal and run: `openssl rand -base64 32` (twice for two different secrets)
   - Or use https://generate-secret.vercel.app/32

5. **Create Web Service**
   - Click "Create Web Service"
   - Wait for deployment (~2-3 minutes)
   - **Copy your backend URL:** `https://attendance-api-xxxx.onrender.com`

6. **Seed Admin User**
   - Go to "Shell" tab in Render dashboard
   - Run: `npm run seed`
   - Default admin created: `admin@attendance.com` / `admin123`

### Step 2: Deploy Frontend to Vercel (FREE)

1. **Sign up at Vercel**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: **Vite** (auto-detected)
   - Root Directory: Click "Edit" → Select `attendance` folder
   - Build Command: `npm run build` (default)
   - Output Directory: `dist` (default)

4. **Add Environment Variable**
   - Click "Environment Variables"
   - Add:
     ```
     VITE_API_URL = https://attendance-api-xxxx.onrender.com/api
     ```
     (Replace with your Render backend URL from Step 1.5)

5. **Deploy**
   - Click "Deploy"
   - Wait ~1-2 minutes
   - Your app is live! 🎉

6. **Update CORS**
   - Copy your Vercel URL: `https://your-app.vercel.app`
   - Go back to Render dashboard → Your backend service
   - Environment Variables → Edit `CORS_ORIGIN`
   - Change to: `https://your-app.vercel.app`
   - Save (service will auto-redeploy)

### Step 3: Test Your App

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Login with: `admin@attendance.com` / `admin123`
3. **IMMEDIATELY change the password!**
4. Create a test employee
5. Test check-in/check-out

**Done! Your app is live for FREE!** 🚀

---

## Option 2: Railway + Vercel (Easier but has usage limits)

**Total Cost:** FREE (with $5 credit/month)
**Limitations:** After $5 credit is used, service stops (usually good for ~500 hours)

### Step 1: Deploy Backend to Railway (FREE $5 credit)

1. **Sign up at Railway**
   - Go to https://railway.app
   - Sign up with GitHub
   - You get $5 free credit/month

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository
   - Click on the deployed service

3. **Add PostgreSQL**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Database will be created automatically

4. **Configure Backend Service**
   - Click on your service (not the database)
   - Go to "Settings" tab
   - Root Directory: `server`
   - Build Command: Leave empty (auto-detected)
   - Start Command: `npm start`

5. **Add Environment Variables**
   - Go to "Variables" tab
   - Add:
     ```
     NODE_ENV = production
     JWT_ACCESS_SECRET = <random-32-char-string>
     JWT_REFRESH_SECRET = <different-random-32-char-string>
     CORS_ORIGIN = https://your-app.vercel.app
     ```
   - DATABASE_URL is auto-added by Railway

6. **Generate Domain**
   - Go to "Settings" tab
   - Click "Generate Domain"
   - **Copy this URL** (e.g., `https://your-app.up.railway.app`)

7. **Run Database Migrations**
   - Go to service → "Deployments" tab
   - Click latest deployment → "View Logs"
   - If you see errors, go to "Settings" → "Deploy"
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`

8. **Seed Database**
   - In Variables tab, add temporary variable:
     ```
     RUN_SEED = true
     ```
   - Redeploy
   - Remove RUN_SEED variable after first deploy

### Step 2: Deploy Frontend to Vercel

*Same as Option 1, Step 2 above*

---

## Option 3: Supabase + Vercel (Alternative with better database)

**Total Cost:** FREE
**Pros:** Better database management, doesn't spin down
**Cons:** More setup required

### Step 1: Create Supabase Database

1. Go to https://supabase.com
2. Create new project
3. Copy database connection URL
4. Use with Render or Railway for backend

### Step 2: Deploy Backend & Frontend

*Same as Option 1 or 2 above, but use Supabase database URL*

---

## Option 4: All-Free Stack (Most Reliable)

**Backend:** Render Free
**Database:** Supabase Free
**Frontend:** Vercel Free

This combination gives you:
- ✅ PostgreSQL that doesn't spin down (Supabase)
- ✅ Backend API (Render - spins down after 15 min)
- ✅ Fast global CDN (Vercel)
- ✅ 100% Free forever

---

## Comparison: Which to Choose?

| Feature | Render + Vercel | Railway + Vercel | Supabase + Render + Vercel |
|---------|----------------|------------------|----------------------------|
| **Cost** | FREE forever | FREE ($5 credit/mo) | FREE forever |
| **Database** | Included | Included | Better performance |
| **Backend Uptime** | Spins down after 15min | Always on (while credit lasts) | Spins down after 15min |
| **Setup Difficulty** | ⭐⭐ Easy | ⭐ Easiest | ⭐⭐⭐ Medium |
| **Best For** | Side projects | Testing/Development | Production-ready free app |

**Recommendation:**
- **Just starting?** → Render + Vercel
- **Need it always on?** → Railway + Vercel (upgrade to paid after testing)
- **Want best free?** → Supabase + Render + Vercel

---

## Important Notes for Free Tier

### Render Free Tier
- ⚠️ Backend spins down after 15 minutes of inactivity
- ⚠️ First request after sleep takes ~30 seconds to wake up
- ✅ 750 hours/month free (enough for most hobby projects)
- ✅ Auto-deploys from GitHub

**Workaround for spin-down:**
Use a free uptime monitor to ping your API every 14 minutes:
- UptimeRobot: https://uptimerobot.com (Free)
- Cron-job.org: https://cron-job.org (Free)

Setup:
1. Create account at UptimeRobot
2. Add new monitor
3. URL: `https://your-backend.onrender.com/health`
4. Interval: 10 minutes
5. Your backend will never sleep! 🎉

### Railway Free Tier
- ✅ $5 credit per month
- ⚠️ Service stops when credit runs out
- ✅ Good for ~500 hours/month
- ⚠️ Requires credit card (won't be charged)

### Vercel Free Tier
- ✅ Unlimited projects
- ✅ 100GB bandwidth/month
- ✅ Auto-scaling
- ✅ Global CDN
- ✅ Auto-deploys from GitHub
- ✅ Free SSL certificates

---

## Auto-Deploy Setup (All Platforms)

All platforms support auto-deployment from GitHub:

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Update"
   git push origin main
   ```

2. **Automatic Deployment:**
   - Vercel: Deploys automatically
   - Render: Deploys automatically
   - Railway: Deploys automatically

**Your app updates automatically on every push!** ✨

---

## Monitoring Your Free Apps

### Check Usage:
- **Render:** Dashboard → Your service → Metrics
- **Railway:** Dashboard → Usage
- **Vercel:** Dashboard → Analytics

### Free Monitoring Tools:
1. **UptimeRobot** - Check if your app is up (Free)
2. **Sentry** - Error tracking (Free tier: 5,000 events/month)
3. **LogRocket** - Session replay (Free tier: 1,000 sessions/month)

---

## Troubleshooting Free Hosting

### "Backend is slow on first request"
- This is normal on Render free tier (spin-down)
- Solution: Use UptimeRobot to keep it awake

### "Railway credit ran out"
- You used all $5 credit for the month
- Options:
  1. Wait until next month (resets)
  2. Switch to Render (doesn't have credit system)
  3. Upgrade to Railway hobby plan ($5/month)

### "CORS errors"
- Check `CORS_ORIGIN` in backend matches exact frontend URL
- Include `https://` prefix
- No trailing slash

### "Database connection failed"
- Verify `DATABASE_URL` is correct
- On Render: Use **Internal Database URL** (not External)
- On Railway: DATABASE_URL is auto-set

---

## Upgrade Path (When You Outgrow Free Tier)

**When traffic increases:**

1. **Render:** Upgrade to Starter ($7/month)
   - No spin-down
   - More resources

2. **Railway:** Upgrade to Hobby ($5/month)
   - $5 included credit + pay for usage
   - Usually costs $5-15/month for small apps

3. **Vercel:** Free tier is generous
   - Only upgrade if you need more bandwidth

**Total paid cost when needed:** $5-15/month

---

## Quick Start: Render + Vercel (Fastest Setup)

1. **Backend (5 minutes):**
   - Render.com → New PostgreSQL (free)
   - Render.com → New Web Service (free)
   - Connect GitHub → Set root to `server`
   - Add environment variables
   - Deploy

2. **Frontend (3 minutes):**
   - Vercel.com → Import GitHub
   - Set root to `attendance`
   - Add VITE_API_URL
   - Deploy

3. **Done! (8 minutes total)** 🎉

---

## Need Help?

**Platform Support:**
- Render: https://render.com/docs
- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs

**Common Issues:**
- Check deployment logs first
- Verify environment variables
- Test with `curl https://your-api.com/health`

---

**Ready to deploy?** Start with **Render + Vercel** - it's the easiest free option!

Your attendance tracking system will be live in less than 10 minutes! 🚀
