"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
async function main() {
    console.log('--- Starting Connection Tests ---');
    // 1. Test with current Hostname from env
    const envUrl = process.env.DATABASE_URL;
    console.log(`\nTest 1: Connecting to url from env (${envUrl?.split('@')[1]})`);
    const prisma1 = new client_1.PrismaClient();
    try {
        await prisma1.$connect();
        console.log('✅ SUCCESS: Connected using .env URL!');
        await prisma1.$disconnect();
        return;
    }
    catch (e) {
        console.log('❌ FAILED using .env URL:', e.message || e);
    }
    finally {
        await prisma1.$disconnect();
    }
    // 2. Test with Direct IP (derived from cPanel URL logic or common knowledge)
    // The user sent a screenshot with cPanel IP 157.180.49.182
    const directIp = '157.180.49.182';
    // Construct URL manually: mysql://user:pass@IP:3306/db?params
    // We need to parse the existing env to get user/pass/db
    if (!envUrl)
        return;
    try {
        const match = envUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(.*)/);
        if (match) {
            const [_, user, pass, oldHost, port, db, params] = match;
            const newUrl = `mysql://${user}:${pass}@${directIp}:${port}/${db}${params || '?sslmode=disable'}`;
            console.log(`\nTest 2: Connecting to Direct IP ${directIp}...`);
            const prisma2 = new client_1.PrismaClient({
                datasources: {
                    db: { url: newUrl },
                },
            });
            try {
                await prisma2.$connect();
                console.log('✅ SUCCESS: Connected using Direct IP!');
                console.log('RECOMMENDATION: Update .env host to ' + directIp);
                await prisma2.$disconnect();
                return;
            }
            catch (e) {
                console.log('❌ FAILED using Direct IP:', e.message || e);
            }
            finally {
                await prisma2.$disconnect();
            }
        }
        else {
            console.log('Could not parse .env URL for Direct IP test.');
        }
    }
    catch (err) {
        console.error("Error constructing Direct IP url", err);
    }
}
main();
