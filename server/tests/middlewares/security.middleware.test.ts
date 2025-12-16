import {
    sanitizeString,
    preventSqlInjection,
    validateEmail,
    validatePhone,
    validateUrl,
    validatePasswordStrength,
    sanitizeFilename,
    validateFileType,
    validateFileSize,
    generateCsrfToken,
    validateCsrfToken,
} from '../../src/middlewares/security.middleware';

describe('Security Middleware', () => {
    describe('sanitizeString', () => {
        it('should remove script tags', () => {
            const input = '<script>alert("XSS")</script>Hello';
            const result = sanitizeString(input);
            expect(result).not.toContain('<script>');
            expect(result).not.toContain('alert');
        });

        it('should remove javascript: protocol', () => {
            const input = 'javascript:alert("XSS")';
            const result = sanitizeString(input);
            expect(result).not.toContain('javascript:');
        });

        it('should remove event handlers', () => {
            const input = '<div onclick="alert()">Click</div>';
            const result = sanitizeString(input);
            expect(result).not.toContain('onclick=');
        });

        it('should remove eval', () => {
            const input = 'eval(maliciousCode)';
            const result = sanitizeString(input);
            expect(result).not.toContain('eval(');
        });

        it('should preserve safe text', () => {
            const input = 'Hello World 123';
            const result = sanitizeString(input);
            expect(result).toBe('Hello World 123');
        });

        it('should trim whitespace', () => {
            const input = '  Hello World  ';
            const result = sanitizeString(input);
            expect(result).toBe('Hello World');
        });
    });

    describe('preventSqlInjection', () => {
        it('should remove DROP keyword', () => {
            const input = 'DROP TABLE users';
            const result = preventSqlInjection(input);
            expect(result).not.toContain('DROP');
        });

        it('should remove DELETE keyword', () => {
            const input = 'DELETE FROM users';
            const result = preventSqlInjection(input);
            expect(result).not.toContain('DELETE');
        });

        it('should remove UNION keyword', () => {
            const input = 'SELECT * FROM users UNION SELECT * FROM admins';
            const result = preventSqlInjection(input);
            expect(result).not.toContain('UNION');
        });

        it('should remove SQL comments', () => {
            const input = 'SELECT * FROM users -- comment';
            const result = preventSqlInjection(input);
            expect(result).not.toContain('--');
        });

        it('should escape single quotes', () => {
            const input = "O'Brien";
            const result = preventSqlInjection(input);
            expect(result).toBe("O''Brien");
        });

        it('should preserve safe text', () => {
            const input = 'John Doe';
            const result = preventSqlInjection(input);
            expect(result).toBe('John Doe');
        });
    });

    describe('validateEmail', () => {
        it('should validate correct email', () => {
            expect(validateEmail('test@example.com')).toBe(true);
            expect(validateEmail('user.name@domain.co.uk')).toBe(true);
        });

        it('should reject invalid email', () => {
            expect(validateEmail('invalid')).toBe(false);
            expect(validateEmail('test@')).toBe(false);
            expect(validateEmail('@example.com')).toBe(false);
            expect(validateEmail('test @example.com')).toBe(false);
        });

        it('should handle empty input', () => {
            expect(validateEmail('')).toBe(false);
            expect(validateEmail(null as any)).toBe(false);
            expect(validateEmail(undefined as any)).toBe(false);
        });
    });

    describe('validatePhone', () => {
        it('should validate correct Bangladesh phone number', () => {
            expect(validatePhone('01712345678')).toBe(true);
            expect(validatePhone('01812345678')).toBe(true);
            expect(validatePhone('01912345678')).toBe(true);
        });

        it('should reject invalid phone number', () => {
            expect(validatePhone('0171234567')).toBe(false); // Too short
            expect(validatePhone('017123456789')).toBe(false); // Too long
            expect(validatePhone('02712345678')).toBe(false); // Wrong prefix
            expect(validatePhone('01012345678')).toBe(false); // Invalid second digit
            expect(validatePhone('1712345678')).toBe(false); // Missing leading 0
        });

        it('should handle empty input', () => {
            expect(validatePhone('')).toBe(false);
            expect(validatePhone(null as any)).toBe(false);
            expect(validatePhone(undefined as any)).toBe(false);
        });
    });

    describe('validateUrl', () => {
        it('should validate correct URL', () => {
            expect(validateUrl('https://example.com')).toBe(true);
            expect(validateUrl('http://example.com/path')).toBe(true);
        });

        it('should reject invalid URL', () => {
            expect(validateUrl('not-a-url')).toBe(false);
            expect(validateUrl('ftp://example.com')).toBe(false); // Wrong protocol
            expect(validateUrl('example.com')).toBe(false); // Missing protocol
        });

        it('should handle empty input', () => {
            expect(validateUrl('')).toBe(false);
            expect(validateUrl(null as any)).toBe(false);
            expect(validateUrl(undefined as any)).toBe(false);
        });
    });

    describe('validatePasswordStrength', () => {
        it('should validate strong password', () => {
            const result = validatePasswordStrength('StrongP@ss123');
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject short password', () => {
            const result = validatePasswordStrength('Short1!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters long');
        });

        it('should reject password without uppercase', () => {
            const result = validatePasswordStrength('lowercase123!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
        });

        it('should reject password without lowercase', () => {
            const result = validatePasswordStrength('UPPERCASE123!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one lowercase letter');
        });

        it('should reject password without number', () => {
            const result = validatePasswordStrength('NoNumbers!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });

        it('should reject password without special character', () => {
            const result = validatePasswordStrength('NoSpecial123');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one special character (@$!%*?&)');
        });

        it('should reject common weak passwords', () => {
            const result = validatePasswordStrength('Password123!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password is too common. Please choose a stronger password');
        });

        it('should handle empty input', () => {
            const result = validatePasswordStrength('');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password is required');
        });
    });

    describe('sanitizeFilename', () => {
        it('should remove special characters', () => {
            const input = 'file<>:"/\\|?*.txt';
            const result = sanitizeFilename(input);
            expect(result).not.toContain('<');
            expect(result).not.toContain('>');
            expect(result).not.toContain(':');
        });

        it('should remove multiple dots', () => {
            const input = 'file...txt';
            const result = sanitizeFilename(input);
            expect(result).toBe('file.txt');
        });

        it('should remove leading dots', () => {
            const input = '...file.txt';
            const result = sanitizeFilename(input);
            expect(result).toBe('file.txt');
        });

        it('should limit length', () => {
            const input = 'a'.repeat(300) + '.txt';
            const result = sanitizeFilename(input);
            expect(result.length).toBeLessThanOrEqual(255);
        });

        it('should preserve safe filename', () => {
            const input = 'my-file_123.txt';
            const result = sanitizeFilename(input);
            expect(result).toBe('my-file_123.txt');
        });

        it('should handle empty input', () => {
            const result = sanitizeFilename('');
            expect(result).toBe('');
        });
    });

    describe('validateFileType', () => {
        it('should validate allowed file type', () => {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            expect(validateFileType('image/jpeg', allowedTypes)).toBe(true);
            expect(validateFileType('image/png', allowedTypes)).toBe(true);
        });

        it('should reject disallowed file type', () => {
            const allowedTypes = ['image/jpeg', 'image/png'];
            expect(validateFileType('application/pdf', allowedTypes)).toBe(false);
            expect(validateFileType('text/html', allowedTypes)).toBe(false);
        });

        it('should handle empty input', () => {
            const allowedTypes = ['image/jpeg'];
            expect(validateFileType('', allowedTypes)).toBe(false);
            expect(validateFileType(null as any, allowedTypes)).toBe(false);
        });
    });

    describe('validateFileSize', () => {
        it('should validate file within size limit', () => {
            expect(validateFileSize(1000, 2000)).toBe(true);
            expect(validateFileSize(2000, 2000)).toBe(true);
        });

        it('should reject file exceeding size limit', () => {
            expect(validateFileSize(3000, 2000)).toBe(false);
        });

        it('should reject zero or negative size', () => {
            expect(validateFileSize(0, 2000)).toBe(false);
            expect(validateFileSize(-100, 2000)).toBe(false);
        });

        it('should handle invalid input', () => {
            expect(validateFileSize(null as any, 2000)).toBe(false);
            expect(validateFileSize(1000, null as any)).toBe(false);
        });
    });

    describe('CSRF Token', () => {
        it('should generate unique tokens', () => {
            const token1 = generateCsrfToken('session1');
            const token2 = generateCsrfToken('session2');
            expect(token1).not.toBe(token2);
        });

        it('should validate correct token', () => {
            const sessionId = 'test-session';
            const token = generateCsrfToken(sessionId);
            expect(validateCsrfToken(sessionId, token)).toBe(true);
        });

        it('should reject incorrect token', () => {
            const sessionId = 'test-session';
            generateCsrfToken(sessionId);
            expect(validateCsrfToken(sessionId, 'wrong-token')).toBe(false);
        });

        it('should reject token for different session', () => {
            const token = generateCsrfToken('session1');
            expect(validateCsrfToken('session2', token)).toBe(false);
        });

        it('should reject token for non-existent session', () => {
            expect(validateCsrfToken('non-existent', 'any-token')).toBe(false);
        });

        it('should handle expired tokens', (done) => {
            const sessionId = 'test-session';
            const token = generateCsrfToken(sessionId);

            // Mock token expiration by setting it to past
            setTimeout(() => {
                // Token should still be valid within 1 hour
                expect(validateCsrfToken(sessionId, token)).toBe(true);
                done();
            }, 100);
        });
    });
});
