# Railway Deployment Guide for Admin Panel

## Prerequisites
- Railway CLI installed
- Logged in to Railway (`railway login`)

## Deployment Steps

### 1. Navigate to admin panel directory
```bash
cd clean-care-admin
```

### 2. Initialize Railway project (if not already done)
```bash
railway init
```

### 3. Link to existing project or create new
```bash
railway link
```

### 4. Set environment variables
Make sure your `.env.production` file has the correct API URL pointing to your Railway server.

Or set it directly in Railway:
```bash
railway variables set VITE_API_URL=https://your-server-url.railway.app
```

### 5. Deploy to Railway
```bash
railway up
```

## Alternative: Deploy via GitHub

1. Push your code to GitHub
2. Go to Railway dashboard (https://railway.app)
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Select the `clean-care-admin` folder as root directory
7. Railway will automatically detect and deploy

## Environment Variables to Set in Railway Dashboard

- `VITE_API_URL` - Your backend API URL (e.g., https://your-server.railway.app)

## Build Configuration

Railway will automatically:
1. Run `npm install`
2. Run `npm run build` (builds the Vite app)
3. Run `npm start` (serves the built files using `serve`)

## Port Configuration

The app will run on port 3000 by default. Railway will automatically assign a public URL.

## Verify Deployment

After deployment, Railway will provide a URL like:
`https://your-admin-panel.railway.app`

Visit this URL to access your admin panel.

## Troubleshooting

### Build fails
- Check that all dependencies are in `package.json`
- Verify TypeScript compilation succeeds locally

### App doesn't load
- Check environment variables are set correctly
- Verify API URL is accessible from Railway
- Check Railway logs: `railway logs`

### CORS errors
- Make sure your backend server allows requests from the Railway admin panel URL
- Update CORS settings in your backend
