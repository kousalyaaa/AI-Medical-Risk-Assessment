# Health Guardian AI - Complete Setup Guide

## 🎯 Migration Complete: Supabase → Flask + MongoDB

Your application has been successfully migrated from Supabase to Flask + MongoDB. CORS issues are now completely resolved!

## 📋 Prerequisites

Before running the application, ensure you have:

1. **Python 3.8+** installed
2. **MongoDB** installed and running
3. **Node.js 16+** and **npm/yarn** installed
4. **Hugging Face API key** (free from https://huggingface.co/settings/tokens)

## 🚀 Quick Start (3 Steps)

### Step 1: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env file with your settings (see Environment Variables section below)
# Required: MONGODB_URI, HUGGINGFACE_API_KEY, JWT_SECRET_KEY
```

### Step 2: Start Backend
```bash
# Start the Flask backend server
python app.py
```
Backend will run on: `http://localhost:5000`

### Step 3: Frontend Setup
```bash
# In a new terminal, navigate to root directory
cd ..

# Install frontend dependencies
npm install

# Create frontend environment file
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env.local

# Start the development server
npm run dev
```
Frontend will run on: `http://localhost:5173`

## 🔧 Detailed Environment Setup

### Backend (.env file)
Create `backend/.env` with these values:

```env
# Flask Configuration
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production
FLASK_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/health_guardian

# Hugging Face API (get free key from https://huggingface.co/settings/tokens)
HUGGINGFACE_API_KEY=hf_your_api_key_here

# CORS Origins (your frontend URLs)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (.env.local file)
Create `.env.local` in root directory:

```env
VITE_API_BASE_URL=/api
```

**Note:** Use `/api` (relative path) to leverage Vite's proxy configuration, not the full URL which would cause CORS issues.

## 🗄️ MongoDB Setup

### Option 1: Local MongoDB
```bash
# Install MongoDB Community Edition
# Windows: Download from https://www.mongodb.com/try/download/community
# macOS: brew install mongodb-community
# Linux: Follow official documentation

# Start MongoDB service
mongod

# Or with brew (macOS):
brew services start mongodb-community
```

### Option 2: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/atlas
2. Create free cluster
3. Get connection string and update `MONGODB_URI` in `.env`

## 🧪 Testing the Application

### 1. Register a New Account
- Go to `http://localhost:5173/signup`
- Create an account with email/password

### 2. Test Authentication
- Sign in with your credentials
- Should redirect to dashboard

### 3. Test AI Features (No CORS!)
- Create a health assessment
- Generate diet plans - should work without CORS errors!
- Generate lifestyle analyses - should work without CORS errors!

### 4. Verify Backend API
Test endpoints with curl:
```bash
# Test backend health
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📁 Project Structure

```
health-guardian-ai/
├── backend/                    # Flask backend
│   ├── app.py                 # Main Flask application
│   ├── requirements.txt       # Python dependencies
│   └── .env.example          # Environment template
├── src/                       # React frontend
│   ├── contexts/
│   │   └── AuthContext.tsx   # JWT authentication
│   ├── hooks/                # Updated API hooks
│   ├── integrations/
│   │   └── api/
│   │       └── client.ts     # Flask API client
│   └── components/           # React components
├── supabase/                 # (Can be removed after testing)
└── SETUP.md                 # This setup guide
```

## 🔍 Troubleshooting

### Backend Issues
```bash
# Check if MongoDB is running
mongo --eval "db.stats()"

# Check Flask logs for errors
python app.py  # Look for error messages

# Test MongoDB connection
python -c "from pymongo import MongoClient; client = MongoClient('mongodb://localhost:27017/'); print('Connected:', client.health_guardian.command('ping'))"
```

### Frontend Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check environment variables
cat .env.local

# Check for console errors in browser dev tools
```

### CORS Still Happening?
If you still see CORS errors:
1. Make sure backend is running on port 5000
2. Check that `VITE_API_BASE_URL=http://localhost:5000/api` is set
3. Verify CORS_ORIGINS in backend .env includes your frontend URL
4. Restart both backend and frontend servers

## 🎉 Success Indicators

✅ **Backend running** on http://localhost:5000
✅ **Frontend running** on http://localhost:5173
✅ **MongoDB connected** (no connection errors in logs)
✅ **Registration works** (can create accounts)
✅ **Login works** (JWT tokens generated)
✅ **AI features work** (diet plans & lifestyle analyses generate without CORS errors)
✅ **No CORS errors** in browser console

## 🚀 Production Deployment

For production deployment:

1. **Backend**: Use Gunicorn, set strong JWT_SECRET_KEY, configure production MongoDB
2. **Frontend**: Build with `npm run build`, serve static files
3. **Database**: Use MongoDB Atlas or managed MongoDB service
4. **Environment**: Set FLASK_ENV=production, configure proper CORS origins

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Check browser console and server logs for error messages

Your Health Guardian AI is now running on a robust Flask + MongoDB backend with zero CORS issues! 🎯
