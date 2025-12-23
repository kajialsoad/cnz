import { signAccessToken, JwtPayload } from '../../src/utils/jwt';

/**
 * Generate access token for testing
 */
export function generateAccessToken(payload: Partial<JwtPayload>): string {
    const fullPayload: JwtPayload = {
        id: payload.id || 1,
        sub: payload.sub || payload.id || 1,
        role: payload.role || 'CUSTOMER',
        email: payload.email,
        phone: payload.phone,
        zoneId: payload.zoneId,
        wardId: payload.wardId,
        cityCorporationCode: payload.cityCorporationCode,
        sessionId: payload.sessionId || 'test-session',
    };

    return signAccessToken(fullPayload);
}
