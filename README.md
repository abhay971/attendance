# Attendance Tracking System 🕐

A modern, full-stack employee attendance tracking application with real-time geolocation-based check-ins and comprehensive admin management.

## ✨ Features

### For Employees
- ✅ Quick check-in/check-out with GPS location tracking
- ✅ Attendance history with detailed records
- ✅ Personal statistics and insights
- ✅ Real-time address display (reverse geocoding)
- ✅ Mobile-responsive interface

### For Administrators
- ✅ Employee management (create, update, deactivate)
- ✅ Real-time attendance monitoring
- ✅ Dashboard with statistics and charts
- ✅ Individual employee tracking
- ✅ Category-wise attendance views (Not Checked In, Currently Working, Completed)
- ✅ Interactive map views with check-in/check-out locations
- ✅ Attendance reports and analytics

## 🚀 Tech Stack

### Backend
- **Framework:** Fastify 5 (Node.js)
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (access + refresh tokens)
- **Security:** Helmet, Rate Limiting, Bcrypt
- **Geocoding:** OpenStreetMap Nominatim API (free)

### Frontend
- **Framework:** React 19 with Vite 7
- **Styling:** Tailwind CSS 4
- **Routing:** React Router 7
- **Maps:** Leaflet.js + React-Leaflet
- **Charts:** Recharts
- **HTTP Client:** Axios

## 🎨 Design
- **Primary:** Orange (#F37E3A)
- **Secondary:** Blue (#288EC2)
- **Success:** Green (#6EBD49)
- **Neutral:** Black/Gray shades

## 📋 Prerequisites

- Node.js 20.x or higher
- PostgreSQL 14 or higher
- npm or yarn

## 🛠️ Local Development Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd Attendance
```

### 2. Backend Setup
```bash
cd server

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials and secrets

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed initial data (creates admin user)
npm run seed

# Start development server
npm run dev
```

Backend will run on `http://localhost:3000`

**Default Admin Credentials:**
- Email: `admin@attendance.com`
- Password: `admin123`

### 3. Frontend Setup
```bash
cd ../attendance

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

## 📦 Project Structure

```
Attendance/
├── server/                 # Backend API
│   ├── prisma/            # Database schema and migrations
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── middlewares/   # Auth, CORS, etc.
│   │   ├── modules/       # Feature modules
│   │   │   ├── auth/      # Authentication
│   │   │   ├── attendance/# Attendance tracking
│   │   │   └── admin/     # Admin management
│   │   └── utils/         # Utilities (JWT, password, etc.)
│   └── package.json
│
├── attendance/            # Frontend React app
│   ├── src/
│   │   ├── api/          # API client functions
│   │   ├── components/   # Reusable components
│   │   ├── context/      # React context (Auth)
│   │   ├── pages/        # Page components
│   │   │   ├── admin/   # Admin pages
│   │   │   └── employee/# Employee pages
│   │   └── routes/      # Router configuration
│   └── package.json
│
├── SECURITY.md           # Security documentation
├── DEPLOYMENT.md         # Deployment guide
└── README.md            # This file
```

## 🔐 Security Features

- JWT-based authentication with refresh tokens
- HttpOnly cookies (prevents XSS)
- Secure cookies in production (HTTPS only)
- CSRF protection (SameSite: strict)
- Rate limiting (prevents brute force)
- Bcrypt password hashing (12 rounds)
- Security headers (Helmet middleware)
- Input validation (Zod schemas)
- SQL injection prevention (Prisma ORM)
- Request size limits

See [SECURITY.md](./SECURITY.md) for complete security documentation.

## 🚢 Deployment

### Quick Deploy (Recommended)
**Railway + Vercel** - Deploy in 10 minutes for $5/month

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step deployment instructions.

### Deployment Options:
1. **Railway + Vercel** (Easiest) - $5/month
2. **Render + Netlify** - $7/month
3. **VPS (DigitalOcean, AWS)** - $12+/month
4. **Docker** - Any container platform

## 📱 Screenshots

### Employee Dashboard
- Check-in/Check-out with live location
- Today's status and working hours
- Quick stats overview

### Admin Dashboard
- Real-time employee monitoring
- Attendance statistics with charts
- Department-wise breakdown
- Track who's not checked in, currently working, or completed

### Attendance History
- Complete attendance records with addresses
- Expandable detailed views
- Date range filters

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Employee Attendance
- `POST /api/attendance/check-in` - Check in with location
- `POST /api/attendance/check-out` - Check out with location
- `GET /api/attendance/status` - Current status
- `GET /api/attendance/history` - Attendance history
- `GET /api/attendance/stats` - Personal statistics

### Admin (Protected)
- `POST /api/admin/employees` - Create employee
- `GET /api/admin/employees` - List employees
- `GET /api/admin/employees/:id` - Get employee details
- `PUT /api/admin/employees/:id` - Update employee
- `DELETE /api/admin/employees/:id` - Deactivate employee
- `GET /api/admin/attendance` - All attendance records
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/dashboard/not-checked-in` - Employees not checked in
- `GET /api/admin/dashboard/need-checkout` - Employees needing checkout
- `GET /api/admin/employees/:id/attendance` - Individual employee attendance

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test
```

### Frontend Tests
```bash
cd attendance
npm test
```

## 🔧 Development Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run seed         # Seed database
npx prisma studio    # Open Prisma Studio (DB GUI)
npx prisma migrate dev --name <name>  # Create new migration
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## 📄 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/attendance"
JWT_ACCESS_SECRET="your-secret-min-32-chars"
JWT_REFRESH_SECRET="your-different-secret-min-32-chars"
CORS_ORIGIN="http://localhost:5173"
PORT=3000
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=/api
```

For production, see `.env.production.example` files.

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify connection
psql $DATABASE_URL
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or change port in .env
PORT=3001
```

### Prisma Issues
```bash
# Regenerate client
npx prisma generate

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

## 📚 Documentation

- [SECURITY.md](./SECURITY.md) - Complete security guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions
- [Prisma Docs](https://www.prisma.io/docs/)
- [Fastify Docs](https://www.fastify.io/)
- [React Docs](https://react.dev/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Built with ❤️ by Yashraj Devara

## 🙏 Acknowledgments

- OpenStreetMap for free geocoding
- Leaflet.js for maps
- All open-source contributors

---

**Ready to deploy?** Check out [DEPLOYMENT.md](./DEPLOYMENT.md) for hosting options!
