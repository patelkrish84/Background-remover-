# 🎨 ClearCut AI — Background Remover

A high-tech, full-stack web application for AI-powered background removal.  
Built with React + Tailwind (frontend) and Node.js + MongoDB (backend).

## 🎨 Color Palette
- **Gold** `#FFC570` — Primary brand accent
- **Cream** `#EFD2B0` — Text & headings
- **Steel** `#547792` — Secondary / muted
- **Navy** `#1A3263` — Base background tones

---

## 🗂️ Project Structure

```
bgremover/
├── backend/
│   ├── models/
│   │   └── User.js           # MongoDB user schema with coins
│   ├── routes/
│   │   ├── auth.js           # Register, login, profile
│   │   └── images.js         # Remove BG, stats, upgrade
│   ├── middleware/
│   │   └── auth.js           # JWT authentication
│   ├── server.js             # Express entry point
│   ├── .env                  # Environment variables
│   └── package.json
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── LandingPage.jsx     # Home page with upload zone
        │   ├── LoginPage.jsx       # Sign in
        │   ├── RegisterPage.jsx    # Sign up (shows pending image)
        │   ├── DashboardPage.jsx   # Main app — upload & process
        │   └── PricingPage.jsx     # 3 plans with coin system
        ├── components/
        │   └── CoinBar.jsx         # Coin counter widget
        ├── context/
        │   └── AuthContext.jsx     # Auth state + pending image
        ├── App.jsx                 # Routes
        ├── main.jsx
        └── index.css               # Global styles
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (running locally on port 27017)
- npm or yarn

### 1. Run Setup Script
```bash
chmod +x setup.sh
./setup.sh
```

### 2. Configure Environment
`backend/.env` is pre-configured with your settings:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bgremover
JWT_SECRET=bgremover_super_secret_jwt_key_2024
REMOVAL_BG_API_KEY=zepgYVBgCR4Dd4n5eUNgnCxe
```

### 3. Start MongoDB
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu/Linux
sudo systemctl start mongod

# Manual
mongod --dbpath /data/db
```

### 4. Start Backend
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

### 5. Start Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

---

## 🚀 How It Works

### User Flow
1. **Landing Page** → User drops/clicks to upload an image
2. **If not logged in** → Redirected to Register page (image is remembered)
3. **Register** → Account created with **7 free coins** 🪙
4. **Dashboard** → Pending image auto-processed; user can upload more
5. **Each removal** → Costs 1 coin; real-time coin counter updates
6. **Coins exhausted** → Toast alert + redirect to Pricing page

### 🪙 Coin System
| Plan    | Coins | Price  |
|---------|-------|--------|
| Free    | 7     | $0     |
| Starter | 50    | $9     |
| Pro     | 200   | $29    |
| Elite   | 999   | $79    |

### Image Rules
- ✅ Accepted: JPG, JPEG, PNG, WEBP, GIF
- ❌ Rejected: PDF and any non-image files
- Max size: 12MB

---

## 🔌 API Endpoints

### Auth
```
POST /api/auth/register    → { name, email, password }
POST /api/auth/login       → { email, password }
GET  /api/auth/profile     → [Requires JWT]
```

### Images
```
POST /api/images/remove-bg → [Requires JWT] multipart/form-data (image)
GET  /api/images/stats     → [Requires JWT]
POST /api/images/upgrade   → [Requires JWT] { plan: 'starter'|'pro'|'elite' }
```

---

## 🌐 Deployment

### Backend (Railway / Render / VPS)
1. Set environment variables on your host
2. Change `MONGODB_URI` to MongoDB Atlas URI
3. Update CORS origins in `server.js`

### Frontend (Vercel / Netlify)
1. Set `VITE_API_URL` in Vercel/Netlify env vars
2. Update `vite.config.js` proxy for production

---

## 💡 Features
- ✅ JWT Authentication (7-day tokens)
- ✅ Image-only upload enforcement (no PDFs)
- ✅ Coin-based usage system
- ✅ 3 paid plans (Starter / Pro / Elite)
- ✅ Real-time coin counter
- ✅ Toast notifications for limit reached
- ✅ Pending image flow (upload → register → auto-process)
- ✅ Transparent PNG preview with checkerboard
- ✅ One-click download
- ✅ Mobile responsive
- ✅ Rate limiting (100 req / 15 min)
- ✅ MongoDB with monthly reset tracking

---

## 🔑 Tech Stack
| Layer    | Tech                                    |
|----------|-----------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend  | Node.js, Express.js                     |
| Database | MongoDB + Mongoose                      |
| AI API   | removal.bg                              |
| Auth     | JWT (jsonwebtoken) + bcryptjs           |
| Upload   | react-dropzone + multer                 |
