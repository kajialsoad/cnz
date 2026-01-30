"use strict";
/**
 * XSS Sanitizer Utility
 *
 * Provides content sanitization to prevent XSS attacks
 * Uses regex patterns to strip all HTML tags and dangerous content
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeContent = sanitizeContent;
exports.sanitizeMultiple = sanitizeMultiple;
/**
 * Sanitize content to prevent XSS attacks
 * Removes all HTML tags, scripts, event handlers, and dangerous content
 * If content becomes empty after sanitization, returns a safe placeholder
 *
 * @param content - Content to sanitize
 * @returns Sanitized content with all dangerous elements removed
 */
function sanitizeContent(content) {
    if (!content) {
        return content;
    }
    let sanitized = content;
    // Remove all HTML tags (including script, style, iframe, etc.)
    // This will extract text content from tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');
    // Remove data: protocol with HTML
    sanitized = sanitized.replace(/data:text\/html[^,]*,/gi, '');
    // Remove vbscript: protocol
    sanitized = sanitized.replace(/vbscript:/gi, '');
    // Remove event handlers (onclick, onerror, onload, etc.)
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    // Remove eval() calls
    sanitized = sanitized.replace(/eval\s*\(/gi, '');
    // Remove expression() calls (CSS expressions)
    sanitized = sanitized.replace(/expression\s*\(/gi, '');
    // Decode HTML entities to prevent encoded XSS
    sanitized = sanitized.replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
    // Run sanitization again after decoding to catch encoded attacks
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    // Trim whitespace
    sanitized = sanitized.trim();
    // If content is empty after sanitization, return a safe placeholder
    // This prevents validation errors while still blocking XSS
    if (!sanitized || sanitized.length === 0) {
        return '[Content removed for security]';
    }
    return sanitized;
}
/**
 * Sanitize multiple content fields
 *
 * @param contents - Array of content strings to sanitize
 * @returns Array of sanitized content strings
 */
function sanitizeMultiple(contents) {
    return contents.map(content => sanitizeContent(content));
}
