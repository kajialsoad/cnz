"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reviewController = __importStar(require("../controllers/review.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * Review Routes
 * Base path: /api/complaints/:complaintId/reviews (user routes)
 * Base path: /api/admin/complaints/analytics/reviews (admin routes)
 */
/**
 * POST /api/complaints/:complaintId/review
 * Submit a review for a complaint
 * @param   complaintId - Complaint ID
 * @body    rating - Rating (1-5)
 * @body    comment - Optional comment (max 300 chars)
 * @access  Private (Authenticated users, must own complaint)
 */
router.post('/:complaintId/review', auth_middleware_1.authGuard, reviewController.submitReview);
/**
 * GET /api/complaints/:complaintId/reviews
 * Get all reviews for a specific complaint
 * @param   complaintId - Complaint ID
 * @access  Public (anyone can view reviews)
 */
router.get('/:complaintId/reviews', reviewController.getComplaintReviews);
exports.default = router;
