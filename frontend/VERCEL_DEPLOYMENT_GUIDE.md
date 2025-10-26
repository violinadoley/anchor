# Vercel Deployment Guide

## Quick Deploy (Recommended)

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Go to Vercel**: https://vercel.com
2. **Sign in** with GitHub
3. **Import Project**: Click "Add New" → "Project"
4. **Select Repository**: Choose `violinadoley/anchor` from your GitHub repos
5. **Configure Project**:
   - Framework Preset: **Next.js**
   - Root Directory: `frontend/` (IMPORTANT!)
   - Build Command: `npm run build` (or leave default)
   - Output Directory: `.next`
6. **Environment Variables** (if needed):
   - `NEXT_PUBLIC_CHAIN_ID` = `11155111`
   - `NEXT_PUBLIC_CHAIN_NAME` = `Sepolia`
7. **Deploy**: Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to frontend directory
cd frontend

# Deploy to production
vercel --prod

# Follow the prompts:
# - Set up and deploy: Yes
# - Which scope: Your account
# - Link to existing project: No
# - Project name: anchor (or anchor-protocol)
# - Directory: ./ (frontend root)
# - Override settings: No
```

## Important Notes

### Backend URL Configuration

The frontend expects the backend to run on `http://localhost:3001`. For production:

1. **Deploy backend separately** (Railway, Render, Heroku, etc.)
2. **Update frontend code** to use production backend URL
3. **Set environment variable** in Vercel:
   - `NEXT_PUBLIC_BACKEND_URL` = `https://your-backend-url.com`

### Required Changes for Production

Edit `frontend/src/app/simulation/page.tsx` and other API calls:

```typescript
// Change from:
const BACKEND_URL = 'http://localhost:3001';

// To:
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
```

### Environment Variables in Vercel

Go to your project settings → Environment Variables and add:

```
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_CHAIN_NAME=Sepolia
NEXT_PUBLIC_BACKEND_URL=https://your-backend.com
```

## Post-Deployment Checklist

- [ ] Frontend deployed on Vercel
- [ ] Backend running on separate platform
- [ ] Backend URL configured in frontend
- [ ] Wallet connections working (test in browser)
- [ ] All API endpoints responding
- [ ] Smart contract interactions working

## Troubleshooting

### Build Fails
- Check that `frontend/` is set as Root Directory
- Verify all dependencies in `package.json` are installed

### API Errors
- Ensure backend is deployed and accessible
- Check CORS settings in backend
- Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly

### Wallet Issues
- Verify you're on the correct network (Sepolia)
- Check MetaMask is installed and connected
- Ensure smart contracts are deployed to Sepolia
