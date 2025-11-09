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
        app_1.default.listen(env_1.default.PORT, () => {
            console.log(`Server listening on http://localhost:${env_1.default.PORT}`);
        });
    }
    catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}
start();
