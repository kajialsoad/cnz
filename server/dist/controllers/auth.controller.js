"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.me = me;
const auth_service_1 = require("../services/auth.service");
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2),
    lastName: zod_1.z.string().min(2),
    phone: zod_1.z.string().min(6),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
async function register(req, res) {
    try {
        const body = registerSchema.parse(req.body);
        const result = await auth_service_1.authService.register({
            firstName: body.firstName,
            lastName: body.lastName,
            email: body.email,
            password: body.password,
            phone: body.phone,
        });
        return res.status(200).json(result);
    }
    catch (err) {
        if (err?.name === 'ZodError') {
            return res.status(400).json({ message: 'Validation error', issues: err.issues });
        }
        return res.status(400).json({ message: err?.message ?? 'Registration failed' });
    }
}
async function login(req, res) {
    try {
        const body = loginSchema.parse(req.body);
        const result = await auth_service_1.authService.login({
            email: body.email,
            password: body.password,
        });
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(401).json({ message: err?.message ?? 'Login failed' });
    }
}
async function refresh(req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return res.status(400).json({ message: 'Missing refreshToken' });
        const result = await auth_service_1.authService.refreshTokens(refreshToken);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(401).json({ message: err?.message ?? 'Refresh failed' });
    }
}
async function logout(req, res) {
    try {
        const { refreshToken } = req.body;
        await auth_service_1.authService.logout(refreshToken);
        return res.status(200).json({ message: 'ok' });
    }
    catch (err) {
        return res.status(400).json({ message: err?.message ?? 'Logout failed' });
    }
}
async function me(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const user = await auth_service_1.authService.getProfile(req.user.sub);
        return res.status(200).json({ user });
    }
    catch (err) {
        return res.status(400).json({ message: err?.message ?? 'Failed to load user' });
    }
}
