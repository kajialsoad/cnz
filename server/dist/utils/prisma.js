"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Append connection_limit to DATABASE_URL if not present
const url = process.env.DATABASE_URL
    ? process.env.DATABASE_URL + (process.env.DATABASE_URL.includes('?') ? '&' : '?') + 'connection_limit=5'
    : undefined;
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url,
        },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
exports.default = prisma;
