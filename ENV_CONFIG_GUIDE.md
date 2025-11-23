# Environment Configuration Guide

## Overview
This app uses environment variables to control server connections. You can easily switch between production server and local development server.

## Configuration

### Environment Variables (`.env` file)

The `.env` file contains the following configuration:

```env
USE_PRODUCTION=false

PRODUCTION_URL=https://server-lpf9c0r8p-kajialsoads-projects.vercel.app

LOCAL_WEB_URL=http://localhost:4000
LOCAL_ANDROID_URL=http://192.168.0.100:4000
LOCAL_IOS_URL=http://localhost:4000
```

### How to Use

#### For Production (Vercel Server)
1. Open `.env` file
2. Set `USE_PRODUCTION=true`
3. Run the app: `flutter run`
4. The app will connect to: `https://server-lpf9c0r8p-kajialsoads-projects.vercel.app`

#### For Local Development (Localhost/WiFi)
1. Open `.env` file
2. Set `USE_PRODUCTION=false`
3. Make sure your local server is running on port 4000
4. Run the app: `flutter run`
5. The app will connect to:
   - **Web**: `http://localhost:4000`
   - **Android**: `http://192.168.0.100:4000` (update with your WiFi IP)
   - **iOS**: `http://localhost:4000`

### Updating WiFi IP for Android

If you're testing on Android device over WiFi:

1. Find your computer's WiFi IP address:
   - Windows: Run `ipconfig` in Command Prompt
   - Look for "IPv4 Address" under your WiFi adapter
   
2. Update `.env` file:
   ```env
   LOCAL_ANDROID_URL=http://YOUR_IP_ADDRESS:4000
   ```
   Example: `LOCAL_ANDROID_URL=http://192.168.1.105:4000`

3. Restart the app

## Smart Fallback System

The app has an intelligent fallback system:

- **When `USE_PRODUCTION=false`**: 
  - First tries to connect to local server
  - If local server is not available, automatically falls back to Vercel server
  - Periodically checks if local server is back online

- **When `USE_PRODUCTION=true`**: 
  - Always uses production server
  - No fallback to local

## Debugging

When the app starts, you'll see configuration logs in the console:

```
🔧 Environment Configuration:
   USE_PRODUCTION: false
   Server URL: http://localhost:4000
```

During runtime, you'll see connection status:
- `✅ Local server is back online, switching from Vercel`
- `⚠️ Local server failed, trying Vercel`
- `🌐 Using Vercel server`

## Important Notes

1. **`.env` file is NOT committed to git** - Each developer needs to create their own
2. **Use `.env.example` as template** - Copy it to `.env` and configure
3. **Restart required** - After changing `.env`, restart the app (hot reload won't work)
4. **Release builds** - Always use production mode for release builds

## Troubleshooting

### App not connecting to local server
1. Check if local server is running: `http://localhost:4000/api/health`
2. Verify `USE_PRODUCTION=false` in `.env`
3. For Android, ensure WiFi IP is correct
4. Restart the app

### App not connecting to production server
1. Check if `USE_PRODUCTION=true` in `.env`
2. Verify internet connection
3. Check Vercel server status
4. Restart the app

### Changes not taking effect
1. Stop the app completely
2. Run `flutter pub get`
3. Restart the app (hot reload doesn't reload `.env`)
