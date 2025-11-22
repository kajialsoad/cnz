"use strict";
/**
 * Message Validation Utilities
 * Ensures message quality and prevents abuse
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMessage = validateMessage;
exports.sanitizeMessage = sanitizeMessage;
exports.validateImageUrl = validateImageUrl;
exports.validateVoiceUrl = validateVoiceUrl;
exports.detectSuspiciousActivity = detectSuspiciousActivity;
exports.getMessageStats = getMessageStats;
exports.containsProfanity = containsProfanity;
exports.filterProfanity = filterProfanity;
/**
 * Validate message content
 */
function validateMessage(message) {
    // Check if message exists
    if (!message || typeof message !== 'string') {
        return { valid: false, error: 'Message is required' };
    }
    // Trim whitespace
    const trimmed = message.trim();
    // Check minimum length
    if (trimmed.length === 0) {
        return { valid: false, error: 'Message cannot be empty' };
    }
    // Check maximum length (5000 characters for professional system)
    if (trimmed.length > 5000) {
        return { valid: false, error: 'Message is too long (max 5000 characters)' };
    }
    // Check for spam patterns
    if (isSpam(trimmed)) {
        return { valid: false, error: 'Message appears to be spam' };
    }
    // Check for excessive repetition
    if (hasExcessiveRepetition(trimmed)) {
        return { valid: false, error: 'Message contains excessive repetition' };
    }
    return { valid: true };
}
/**
 * Detect spam patterns
 */
function isSpam(message) {
    const spamPatterns = [
        /(.)\1{20,}/i, // Same character repeated 20+ times
        /(https?:\/\/[^\s]+){5,}/i, // 5+ URLs
        /\b(buy now|click here|limited offer|act now)\b/gi, // Common spam phrases
    ];
    return spamPatterns.some(pattern => pattern.test(message));
}
/**
 * Check for excessive repetition
 */
function hasExcessiveRepetition(message) {
    // Check for repeated words
    const words = message.toLowerCase().split(/\s+/);
    const wordCount = {};
    for (const word of words) {
        if (word.length > 3) { // Only check words longer than 3 characters
            wordCount[word] = (wordCount[word] || 0) + 1;
            if (wordCount[word] > 10) { // Same word repeated 10+ times
                return true;
            }
        }
    }
    return false;
}
/**
 * Sanitize message content
 * Remove potentially harmful content
 */
function sanitizeMessage(message) {
    let sanitized = message.trim();
    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    // Limit consecutive newlines to 3
    sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n');
    return sanitized;
}
/**
 * Validate image URL
 */
function validateImageUrl(url) {
    if (!url) {
        return { valid: true }; // Image is optional
    }
    // Check if it's a valid URL
    try {
        const parsed = new URL(url);
        // Check protocol
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return { valid: false, error: 'Invalid image URL protocol' };
        }
        // Check file extension
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const hasValidExtension = validExtensions.some(ext => url.toLowerCase().endsWith(ext));
        if (!hasValidExtension) {
            return { valid: false, error: 'Invalid image format' };
        }
        return { valid: true };
    }
    catch (error) {
        return { valid: false, error: 'Invalid image URL' };
    }
}
function validateVoiceUrl(url) {
    if (!url) {
        return { valid: true };
    }
    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return { valid: false, error: 'Invalid voice URL protocol' };
        }
        const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
        const hasValidExtension = validExtensions.some(ext => url.toLowerCase().endsWith(ext));
        if (!hasValidExtension) {
            return { valid: false, error: 'Invalid voice format' };
        }
        return { valid: true };
    }
    catch (error) {
        return { valid: false, error: 'Invalid voice URL' };
    }
}
/**
 * Check if user is sending messages too fast
 * Returns true if suspicious activity detected
 */
function detectSuspiciousActivity(recentMessages) {
    if (recentMessages.length < 5) {
        return false;
    }
    // Check if last 5 messages are identical
    const lastFive = recentMessages.slice(0, 5);
    const allSame = lastFive.every(msg => msg.message === lastFive[0].message);
    if (allSame) {
        return true;
    }
    // Check if messages are sent too quickly (< 1 second apart)
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const recentCount = recentMessages.filter(msg => msg.createdAt > oneMinuteAgo).length;
    if (recentCount > 10) {
        return true; // More than 10 messages in 1 minute
    }
    return false;
}
/**
 * Get message statistics
 */
function getMessageStats(message) {
    return {
        length: message.length,
        words: message.split(/\s+/).length,
        lines: message.split('\n').length,
        hasUrls: /https?:\/\/[^\s]+/.test(message),
        hasEmojis: /[\u{1F600}-\u{1F64F}]/u.test(message),
    };
}
/**
 * Profanity filter (basic implementation)
 * In production, use a comprehensive profanity filter library
 */
const profanityWords = [
// Add Bengali and English profanity words here
// This is a placeholder - implement based on your requirements
];
function containsProfanity(message) {
    const lowerMessage = message.toLowerCase();
    return profanityWords.some(word => lowerMessage.includes(word));
}
/**
 * Filter profanity from message
 */
function filterProfanity(message) {
    let filtered = message;
    profanityWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        filtered = filtered.replace(regex, '*'.repeat(word.length));
    });
    return filtered;
}
