#!/bin/bash

# Clean Care App - Vercel Deployment Script
# This script helps deploy both server and admin panel to Vercel

echo "🚀 Clean Care App - Vercel Deployment"
echo "======================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
    echo "✅ Vercel CLI installed"
fi

echo ""
echo "📦 Step 1: Deploy Server (Backend)"
echo "-----------------------------------"
cd server

echo "Building server..."
npm install
npm run build

echo "Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Server deployed!"
echo "📝 Copy the server URL and update the following files:"
echo "   1. clean-care-admin/.env.production"
echo "   2. lib/config/api_config.dart"
echo ""
read -p "Press Enter after updating the files..."

cd ..

echo ""
echo "📦 Step 2: Deploy Admin Panel (Frontend)"
echo "----------------------------------------"
cd clean-care-admin

echo "Building admin panel..."
npm install
npm run build

echo "Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Admin Panel deployed!"
echo ""

cd ..

echo ""
echo "📱 Step 3: Build Mobile App"
echo "---------------------------"
echo "Run the following command to build APK:"
echo "  flutter build apk --release"
echo ""
echo "APK will be available at:"
echo "  build/app/outputs/flutter-apk/app-release.apk"
echo ""

echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "Next steps:"
echo "1. Test server: https://your-server-name.vercel.app/api/health"
echo "2. Test admin panel: https://your-admin-panel.vercel.app"
echo "3. Build and test mobile app"
echo ""
echo "For detailed instructions, see:"
echo "  - APP_DEPLOYMENT_GUIDE_BANGLA.md"
echo "  - DEPLOYMENT_CHECKLIST.md"
echo ""
