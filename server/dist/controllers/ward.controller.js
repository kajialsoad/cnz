"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ward_service_1 = __importDefault(require("../services/ward.service"));
class WardController {
    /**
     * GET /api/admin/wards
     * Get wards with optional zone and status filters
     */
    async getWards(req, res) {
        try {
            const { zoneId, status } = req.query;
            // Validate required zoneId parameter
            if (!zoneId || typeof zoneId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'zoneId query parameter is required',
                });
            }
            const zoneIdNum = parseInt(zoneId);
            if (isNaN(zoneIdNum)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid zoneId format',
                });
            }
            const validStatus = status;
            const wards = await ward_service_1.default.getWardsByZone(zoneIdNum, validStatus || 'ALL');
            res.json({
                success: true,
                data: wards,
            });
        }
        catch (error) {
            console.error('Error fetching wards:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch wards',
                    error: error.message,
                });
            }
        }
    }
    /**
     * GET /api/admin/wards/:id
     * Get single ward by ID
     */
    async getWardById(req, res) {
        try {
            const { id } = req.params;
            const wardId = parseInt(id);
            if (isNaN(wardId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid ward ID',
                });
            }
            const ward = await ward_service_1.default.getWardById(wardId);
            res.json({
                success: true,
                data: ward,
            });
        }
        catch (error) {
            console.error('Error fetching ward:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch ward',
                    error: error.message,
                });
            }
        }
    }
    /**
     * POST /api/admin/wards
     * Create new ward
     */
    async createWard(req, res) {
        try {
            const { wardNumber, zoneId, inspectorName, inspectorSerialNumber } = req.body;
            // Validation
            if (!wardNumber || !zoneId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: wardNumber, zoneId',
                });
            }
            if (typeof wardNumber !== 'number' || wardNumber < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Ward number must be a positive integer',
                });
            }
            if (typeof zoneId !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: 'Zone ID must be a number',
                });
            }
            const ward = await ward_service_1.default.createWard({
                wardNumber,
                zoneId,
                inspectorName,
                inspectorSerialNumber,
            });
            res.status(201).json({
                success: true,
                message: 'Ward created successfully',
                data: ward,
            });
        }
        catch (error) {
            console.error('Error creating ward:', error);
            if (error.message.includes('already exists')) {
                res.status(409).json({
                    success: false,
                    message: error.message,
                });
            }
            else if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            else if (error.message.includes('maximum')) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to create ward',
                    error: error.message,
                });
            }
        }
    }
    /**
     * POST /api/admin/wards/bulk
     * Bulk create wards for a zone
     */
    async createWardsBulk(req, res) {
        try {
            const { zoneId, wardNumbers } = req.body;
            // Validation
            if (!zoneId || !wardNumbers) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: zoneId, wardNumbers',
                });
            }
            if (typeof zoneId !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: 'Zone ID must be a number',
                });
            }
            if (!Array.isArray(wardNumbers) || wardNumbers.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ward numbers must be a non-empty array',
                });
            }
            if (wardNumbers.some(num => typeof num !== 'number' || num < 1)) {
                return res.status(400).json({
                    success: false,
                    message: 'All ward numbers must be positive integers',
                });
            }
            if (wardNumbers.length > 12) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot create more than 12 wards at once',
                });
            }
            const wards = await ward_service_1.default.createWardsBulk(zoneId, wardNumbers);
            res.status(201).json({
                success: true,
                message: `${wards.length} wards created successfully`,
                data: wards,
            });
        }
        catch (error) {
            console.error('Error creating wards in bulk:', error);
            if (error.message.includes('already exist')) {
                res.status(409).json({
                    success: false,
                    message: error.message,
                });
            }
            else if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            else if (error.message.includes('maximum') || error.message.includes('exceed')) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to create wards',
                    error: error.message,
                });
            }
        }
    }
    /**
     * PUT /api/admin/wards/:id
     * Update ward
     */
    async updateWard(req, res) {
        try {
            const { id } = req.params;
            const wardId = parseInt(id);
            if (isNaN(wardId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid ward ID',
                });
            }
            const { inspectorName, inspectorSerialNumber, status } = req.body;
            const updateData = {};
            if (inspectorName !== undefined)
                updateData.inspectorName = inspectorName;
            if (inspectorSerialNumber !== undefined)
                updateData.inspectorSerialNumber = inspectorSerialNumber;
            if (status !== undefined)
                updateData.status = status;
            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No update data provided',
                });
            }
            // Validate inspector data if provided
            if (updateData.inspectorName !== undefined || updateData.inspectorSerialNumber !== undefined) {
                const validation = ward_service_1.default.validateInspectorData({
                    inspectorName: updateData.inspectorName,
                    inspectorSerialNumber: updateData.inspectorSerialNumber,
                });
                if (!validation.valid) {
                    return res.status(400).json({
                        success: false,
                        message: 'Validation failed',
                        errors: validation.errors,
                    });
                }
            }
            const ward = await ward_service_1.default.updateWard(wardId, updateData);
            res.json({
                success: true,
                message: 'Ward updated successfully',
                data: ward,
            });
        }
        catch (error) {
            console.error('Error updating ward:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to update ward',
                    error: error.message,
                });
            }
        }
    }
    /**
     * DELETE /api/admin/wards/:id
     * Delete ward (only if no users assigned)
     */
    async deleteWard(req, res) {
        try {
            const { id } = req.params;
            const wardId = parseInt(id);
            if (isNaN(wardId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid ward ID',
                });
            }
            await ward_service_1.default.deleteWard(wardId);
            res.json({
                success: true,
                message: 'Ward deleted successfully',
            });
        }
        catch (error) {
            console.error('Error deleting ward:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            else if (error.message.includes('Cannot delete')) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to delete ward',
                    error: error.message,
                });
            }
        }
    }
    /**
     * GET /api/admin/wards/:id/statistics
     * Get statistics for ward
     */
    async getWardStatistics(req, res) {
        try {
            const { id } = req.params;
            const wardId = parseInt(id);
            if (isNaN(wardId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid ward ID',
                });
            }
            const stats = await ward_service_1.default.getWardStats(wardId);
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            console.error('Error fetching ward statistics:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch statistics',
                    error: error.message,
                });
            }
        }
    }
    /**
     * GET /api/admin/wards/available/:zoneId
     * Get available ward numbers for a zone
     */
    async getAvailableWardNumbers(req, res) {
        try {
            const { zoneId } = req.params;
            const { maxWardNumber } = req.query;
            const zoneIdNum = parseInt(zoneId);
            if (isNaN(zoneIdNum)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid zone ID',
                });
            }
            const maxNum = maxWardNumber ? parseInt(maxWardNumber) : 100;
            if (isNaN(maxNum) || maxNum < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid maxWardNumber parameter',
                });
            }
            const availableNumbers = await ward_service_1.default.getAvailableWardNumbers(zoneIdNum, maxNum);
            res.json({
                success: true,
                data: availableNumbers,
            });
        }
        catch (error) {
            console.error('Error fetching available ward numbers:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch available ward numbers',
                    error: error.message,
                });
            }
        }
    }
    /**
     * GET /api/admin/wards/limit/:zoneId
     * Check ward limit for zone
     */
    async checkWardLimit(req, res) {
        try {
            const { zoneId } = req.params;
            const zoneIdNum = parseInt(zoneId);
            if (isNaN(zoneIdNum)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid zone ID',
                });
            }
            const limitInfo = await ward_service_1.default.checkWardLimit(zoneIdNum);
            res.json({
                success: true,
                data: limitInfo,
            });
        }
        catch (error) {
            console.error('Error checking ward limit:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check ward limit',
                error: error.message,
            });
        }
    }
}
exports.default = new WardController();
