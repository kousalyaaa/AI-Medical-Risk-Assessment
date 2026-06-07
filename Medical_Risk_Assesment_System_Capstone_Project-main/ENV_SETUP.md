# Environment Variables Setup Guide

## Frontend (.env.local)

Create a file named `.env.local` in the **root directory** (same level as `package.json`):

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### How to create on Windows:
```powershell
# In PowerShell, from the root directory:
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env.local
```

### How to create on Linux/Mac:
```bash
# From the root directory:
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env.local
```

Or manually create the file and paste the content above.

---

## Backend (.env)

Create a file named `.env` in the **backend directory**:

```env
# Flask Configuration
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production-12345
FLASK_ENV=development

# MongoDB Configuration
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/health_guardian

# For MongoDB Atlas (cloud) - replace with your connection string:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/health_guardian?retryWrites=true&w=majority

# Hugging Face API (optional - get free key from https://huggingface.co/settings/tokens)
HUGGINGFACE_API_KEY=hf_your_api_key_here

# CORS Origins (comma-separated list of frontend URLs)
CORS_ORIGINS=http://localhost:8080,http://localhost:5173,http://localhost:3000
```

### How to create on Windows:
```powershell
# Navigate to backend directory first:
cd backend

# Create .env file (you'll need to edit it manually after):
New-Item -Path .env -ItemType File

# Then open it in notepad and paste the content above
notepad .env
```

### How to create on Linux/Mac:
```bash
cd backend
nano .env
# Paste the content above, then save (Ctrl+X, then Y, then Enter)
```

---

## Quick Setup Checklist

- [ ] Create `.env.local` in root directory with `VITE_API_BASE_URL=http://localhost:5000/api`
- [ ] Create `.env` in `backend/` directory with MongoDB URI and JWT_SECRET_KEY
- [ ] Make sure MongoDB is running (or use MongoDB Atlas)
- [ ] Start backend: `cd backend && python app.py`
- [ ] Start frontend: `npm run dev` (from root directory)

---

## Important Notes

1. **JWT_SECRET_KEY**: Use a long random string. You can generate one online or use:
   ```python
   import secrets
   print(secrets.token_urlsafe(32))
   ```

2. **MongoDB**: 
   - Local: Make sure MongoDB service is running
   - Atlas: Get connection string from MongoDB Atlas dashboard

3. **HUGGINGFACE_API_KEY**: Optional - app will work without it, but AI features will use fallback responses

4. **CORS_ORIGINS**: Should include the port where your frontend runs (default is 8080 based on vite.config.ts)
