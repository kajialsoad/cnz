/**
 * Staging Deployment Testing Script
 * 
 * This script tests all category-related functionality on staging environment
 * to verify the deployment was successful.
 * 
 * Usage:
 *   node test-staging-deployment.js
 * 
 * Environment Variables:
 *   STAGING_API_URL - Staging API base URL (default: http://localhost:4000)
 *   ADMIN_TOKEN - Admin authentication token for protected endpoints
 */

const axios = require('axios');

// Configuration
const API_URL = process.env.STAGING_API_URL || 'http://localhost:4000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// Test results
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Helper functions
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
    const status = passed ? '✓' : '✗';
    const color = passed ? 'green' : 'red';
    log(`${status} ${name}`, color);
    if (details) {
        log(`  ${details}`, 'cyan');
    }

    results.tests.push({ name, passed, details });
    if (passed) {
        results.passed++;
    } else {
        results.failed++;
    }
}

function logSection(title) {
    log('\n' + '='.repeat(60), 'blue');
    log(title, 'blue');
    log('='.repeat(60), 'blue');
}

// Test functions
async function testHealthEndpoint() {
    try {
        const response = await axios.get(`${API_URL}/health`);
        logTest('Health endpoint', response.status === 200, `Status: ${response.status}`);
        return response.status === 200;
    } catch (error) {
        logTest('Health endpoint', false, `Error: ${error.message}`);
        return false;
    }
}

async function testGetAllCategories() {
    try {
        const response = await axios.get(