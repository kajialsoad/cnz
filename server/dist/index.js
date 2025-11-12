"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./config/env"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function start() {
    try {
        if (!env_1.default.DEMO_MODE) {
            await prisma.$connect();
        }
        app_1.default.listen(env_1.default.PORT, '0.0.0.0', () => {
            console.log(`Server listening on:`);
            console.log(`  - Local:   http://localhost:${env_1.default.PORT}`);
            console.log(`  - Network: http://10.236.50.46:${env_1.default.PORT}`);
            console.log(`\nServer is accessible from any device on your WiFi network!`);
        });
    }
    catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}
start();
