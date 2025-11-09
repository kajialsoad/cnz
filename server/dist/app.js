"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const prisma_1 = __importDefault(require("./utils/prisma"));
const env_1 = __importDefault(require("./config/env"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const app = (0, express_1.default)();
// Middleware to add prisma to request
app.use((req, res, next) => {
    req.prisma = prisma_1.default;
    next();
});
app.use(express_1.default.json({ limit: '2mb' }));
// Allow multiple origins and any localhost:* during development
const allowedOrigins = env_1.default.CORS_ORIGINS;
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes('*'))
            return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
            return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
app.get('/health', (_req, res) => res.json({ ok: true, status: 'healthy' }));
app.use('/auth', auth_routes_1.default);
app.use('/users', user_routes_1.default);
exports.default = app;
