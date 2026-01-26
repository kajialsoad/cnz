# Server Documentation

This folder contains all documentation, guides, and utility scripts for the Clean Care server.

## Folder Structure

### 📚 `/guides`
Contains all markdown documentation files including:
- Migration guides (staging, production)
- Railway deployment guides
- System architecture documentation
- Feature implementation guides
- Quick reference documents

### 🔧 `/scripts`
Contains utility scripts organized by purpose:

#### `/scripts/migrations`
Database migration and setup scripts:
- `apply-*.js` - Scripts to apply database migrations
- `create-*.js` - Scripts to create database structures
- `migrate-*.js` - Data migration scripts
- `populate-*.js` - Scripts to populate data

#### `/scripts/tests`
Testing and verification scripts:
- `test-*.js` - API and feature testing scripts
- `verify-*.js` - Verification scripts for migrations and features
- `check-*.js` - Health check and validation scripts
- `diagnose-*.js` - Diagnostic scripts for troubleshooting
- `find-*.js` - Data lookup and search scripts

#### `/scripts/utilities`
General utility scripts:
- `cleanup-*.js` - Data cleanup and maintenance scripts
- `add-performance-logging.js` - Performance monitoring setup

### 📖 `/` (root docs folder)
API documentation and technical references:
- API endpoint documentation
- Security implementation guides
- Performance optimization guides
- Quick reference guides

## Usage

### Running Migration Scripts
```bash
cd server
node docs/scripts/migrations/apply-bot-message-migration.js
```

### Running Test Scripts
```bash
cd server
node docs/scripts/tests/test-notification-api.js
```

### Running Utility Scripts
```bash
cd server
node docs/scripts/utilities/cleanup-old-notifications.js
```

## Important Notes

- Always backup your database before running migration scripts
- Test scripts should be run in a development environment first
- Check the guides folder for detailed documentation on each feature
- Refer to deployment guides before deploying to production

## Quick Links

- [Production Migration Guide](./guides/PRODUCTION_MIGRATION_GUIDE.md)
- [Staging Migration Guide](./guides/STAGING_MIGRATION_GUIDE.md)
- [Railway Deployment Guide](./guides/RAILWAY_DEPLOYMENT_COMPLETE_GUIDE.md)
- [Migration Quick Reference](./guides/MIGRATION_QUICK_REFERENCE.md)
