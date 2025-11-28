/**
 * Upload Monitoring Service
 * 
 * This service provides comprehensive monitoring and logging for file uploads to Cloudinary.
 * It tracks upload statistics, error rates, and generates daily summaries.
 */

import fs from 'fs';
import path from 'path';

/**
 * Upload event types
 */
export enum UploadEventType {
    SUCCESS = 'SUCCESS',
    FAILURE = 'FAILURE',
    RETRY = 'RETRY'
}

/**
 * Upload event interface
 */
export interface UploadEvent {
    timestamp: Date;
    type: UploadEventType;
    fileType: 'image' | 'audio';
    filename: string;
    size: number;
    duration?: number;
    error?: string;
    retryAttempt?: number;
    cloudinaryUrl?: string;
    publicId?: string;
}

/**
 * Upload statistics interface
 */
export interface UploadStatistics {
    totalUploads: number;
    successfulUploads: number;
    failedUploads: number;
    retryAttempts: number;
    totalSize: number;
    averageDuration: number;
    errorRate: number;
    imageUploads: number;
    audioUploads: number;
}

/**
 * Daily summary interface
 */
export interface DailySummary {
    date: string;
    statistics: UploadStatistics;
    topErrors: Array<{ error: string; count: number }>;
    largestFiles: Array<{ filename: string; size: number }>;
    slowestUploads: Array<{ filename: string; duration: number }>;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
    errorRateThreshold: number; // Percentage (e.g., 5 for 5%)
    checkIntervalMinutes: number;
    alertCallback?: (message: string, stats: UploadStatistics) => void;
}

/**
 * Upload Monitoring Service Class
 */
class UploadMonitoringService {
    private events: UploadEvent[] = [];
    private logDirectory: string;
    private alertConfig: AlertConfig;
    private lastAlertTime: Date | null = null;
    private alertCooldownMinutes = 30; // Minimum time between alerts

    constructor() {
        this.logDirectory = path.join(process.cwd(), 'logs', 'uploads');
        this.ensureLogDirectory();

        // Default alert configuration
        this.alertConfig = {
            errorRateThreshold: 5, // 5% error rate triggers alert
            checkIntervalMinutes: 15,
            alertCallback: this.defaultAlertCallback.bind(this)
        };

        // Start periodic monitoring
        this.startPeriodicMonitoring();
    }

    /**
     * Ensure log directory exists
     */
    private ensureLogDirectory(): void {
        if (!fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory, { recursive: true });
        }
    }

    /**
     * Log a successful upload
     */
    logSuccess(
        fileType: 'image' | 'audio',
        filename: string,
        size: number,
        duration: number,
        cloudinaryUrl: string,
        publicId: string
    ): void {
        const event: UploadEvent = {
            timestamp: new Date(),
            type: UploadEventType.SUCCESS,
            fileType,
            filename,
            size,
            duration,
            cloudinaryUrl,
            publicId
        };

        this.events.push(event);
        this.writeEventToLog(event);

        // Log to console
        console.log(
            `✅ Upload Success: ${filename} (${fileType}) - ` +
            `${(size / 1024).toFixed(2)} KB in ${duration}ms`
        );
    }

    /**
     * Log a failed upload
     */
    logFailure(
        fileType: 'image' | 'audio',
        filename: string,
        size: number,
        error: string,
        retryAttempt?: number
    ): void {
        const event: UploadEvent = {
            timestamp: new Date(),
            type: UploadEventType.FAILURE,
            fileType,
            filename,
            size,
            error,
            retryAttempt
        };

        this.events.push(event);
        this.writeEventToLog(event);

        // Log to console
        console.error(
            `❌ Upload Failure: ${filename} (${fileType}) - ` +
            `${error}${retryAttempt ? ` (Retry ${retryAttempt})` : ''}`
        );

        // Check if we need to send an alert
        this.checkErrorRate();
    }

    /**
     * Log a retry attempt
     */
    logRetry(
        fileType: 'image' | 'audio',
        filename: string,
        size: number,
        retryAttempt: number,
        error: string
    ): void {
        const event: UploadEvent = {
            timestamp: new Date(),
            type: UploadEventType.RETRY,
            fileType,
            filename,
            size,
            retryAttempt,
            error
        };

        this.events.push(event);
        this.writeEventToLog(event);

        // Log to console
        console.warn(
            `⚠️  Upload Retry: ${filename} (${fileType}) - ` +
            `Attempt ${retryAttempt} - ${error}`
        );
    }

    /**
     * Write event to log file
     */
    private writeEventToLog(event: UploadEvent): void {
        try {
            const date = event.timestamp.toISOString().split('T')[0];
            const logFile = path.join(this.logDirectory, `uploads-${date}.log`);

            const logEntry = JSON.stringify({
                timestamp: event.timestamp.toISOString(),
                type: event.type,
                fileType: event.fileType,
                filename: event.filename,
                size: event.size,
                duration: event.duration,
                error: event.error,
                retryAttempt: event.retryAttempt,
                cloudinaryUrl: event.cloudinaryUrl,
                publicId: event.publicId
            }) + '\n';

            fs.appendFileSync(logFile, logEntry);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    /**
     * Get current statistics
     */
    getStatistics(since?: Date): UploadStatistics {
        const relevantEvents = since
            ? this.events.filter(e => e.timestamp >= since)
            : this.events;

        const totalUploads = relevantEvents.filter(
            e => e.type === UploadEventType.SUCCESS || e.type === UploadEventType.FAILURE
        ).length;

        const successfulUploads = relevantEvents.filter(
            e => e.type === UploadEventType.SUCCESS
        ).length;

        const failedUploads = relevantEvents.filter(
            e => e.type === UploadEventType.FAILURE
        ).length;

        const retryAttempts = relevantEvents.filter(
            e => e.type === UploadEventType.RETRY
        ).length;

        const totalSize = relevantEvents
            .filter(e => e.type === UploadEventType.SUCCESS)
            .reduce((sum, e) => sum + e.size, 0);

        const successfulWithDuration = relevantEvents.filter(
            e => e.type === UploadEventType.SUCCESS && e.duration !== undefined
        );

        const averageDuration = successfulWithDuration.length > 0
            ? successfulWithDuration.reduce((sum, e) => sum + (e.duration || 0), 0) / successfulWithDuration.length
            : 0;

        const errorRate = totalUploads > 0
            ? (failedUploads / totalUploads) * 100
            : 0;

        const imageUploads = relevantEvents.filter(
            e => e.fileType === 'image' && e.type === UploadEventType.SUCCESS
        ).length;

        const audioUploads = relevantEvents.filter(
            e => e.fileType === 'audio' && e.type === UploadEventType.SUCCESS
        ).length;

        return {
            totalUploads,
            successfulUploads,
            failedUploads,
            retryAttempts,
            totalSize,
            averageDuration,
            errorRate,
            imageUploads,
            audioUploads
        };
    }

    /**
     * Generate daily summary
     */
    generateDailySummary(date?: Date): DailySummary {
        const targetDate = date || new Date();
        const dateString = targetDate.toISOString().split('T')[0];

        // Filter events for the target date
        const dayStart = new Date(targetDate);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(targetDate);
        dayEnd.setHours(23, 59, 59, 999);

        const dayEvents = this.events.filter(
            e => e.timestamp >= dayStart && e.timestamp <= dayEnd
        );

        // Calculate statistics
        const statistics = this.getStatistics(dayStart);

        // Get top errors
        const errorCounts = new Map<string, number>();
        dayEvents
            .filter(e => e.error)
            .forEach(e => {
                const count = errorCounts.get(e.error!) || 0;
                errorCounts.set(e.error!, count + 1);
            });

        const topErrors = Array.from(errorCounts.entries())
            .map(([error, count]) => ({ error, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Get largest files
        const largestFiles = dayEvents
            .filter(e => e.type === UploadEventType.SUCCESS)
            .sort((a, b) => b.size - a.size)
            .slice(0, 5)
            .map(e => ({ filename: e.filename, size: e.size }));

        // Get slowest uploads
        const slowestUploads = dayEvents
            .filter(e => e.type === UploadEventType.SUCCESS && e.duration !== undefined)
            .sort((a, b) => (b.duration || 0) - (a.duration || 0))
            .slice(0, 5)
            .map(e => ({ filename: e.filename, duration: e.duration || 0 }));

        const summary: DailySummary = {
            date: dateString,
            statistics,
            topErrors,
            largestFiles,
            slowestUploads
        };

        // Write summary to file
        this.writeDailySummary(summary);

        return summary;
    }

    /**
     * Write daily summary to file
     */
    private writeDailySummary(summary: DailySummary): void {
        try {
            const summaryFile = path.join(
                this.logDirectory,
                `summary-${summary.date}.json`
            );

            fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

            console.log(`📊 Daily summary written: ${summaryFile}`);
        } catch (error) {
            console.error('Failed to write daily summary:', error);
        }
    }

    /**
     * Check error rate and send alert if threshold exceeded
     */
    private checkErrorRate(): void {
        // Get statistics for the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const stats = this.getStatistics(oneHourAgo);

        // Check if error rate exceeds threshold
        if (stats.errorRate >= this.alertConfig.errorRateThreshold) {
            // Check cooldown period
            if (this.lastAlertTime) {
                const minutesSinceLastAlert =
                    (Date.now() - this.lastAlertTime.getTime()) / (1000 * 60);

                if (minutesSinceLastAlert < this.alertCooldownMinutes) {
                    return; // Still in cooldown period
                }
            }

            // Send alert
            const message =
                `⚠️  HIGH ERROR RATE ALERT: ${stats.errorRate.toFixed(2)}% ` +
                `(${stats.failedUploads}/${stats.totalUploads} uploads failed in the last hour)`;

            if (this.alertConfig.alertCallback) {
                this.alertConfig.alertCallback(message, stats);
            }

            this.lastAlertTime = new Date();
        }
    }

    /**
     * Default alert callback (logs to console)
     */
    private defaultAlertCallback(message: string, stats: UploadStatistics): void {
        console.error('\n' + '='.repeat(80));
        console.error(message);
        console.error('='.repeat(80));
        console.error('Statistics:');
        console.error(`  Total Uploads: ${stats.totalUploads}`);
        console.error(`  Successful: ${stats.successfulUploads}`);
        console.error(`  Failed: ${stats.failedUploads}`);
        console.error(`  Error Rate: ${stats.errorRate.toFixed(2)}%`);
        console.error(`  Retry Attempts: ${stats.retryAttempts}`);
        console.error('='.repeat(80) + '\n');
    }

    /**
     * Configure alert settings
     */
    configureAlerts(config: Partial<AlertConfig>): void {
        this.alertConfig = {
            ...this.alertConfig,
            ...config
        };
    }

    /**
     * Start periodic monitoring
     */
    private startPeriodicMonitoring(): void {
        // Generate daily summary at midnight
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const msUntilMidnight = tomorrow.getTime() - now.getTime();

        setTimeout(() => {
            this.generateDailySummary(new Date(Date.now() - 24 * 60 * 60 * 1000));

            // Schedule daily summary generation
            setInterval(() => {
                this.generateDailySummary(new Date(Date.now() - 24 * 60 * 60 * 1000));
            }, 24 * 60 * 60 * 1000);
        }, msUntilMidnight);

        // Check error rate periodically
        setInterval(() => {
            this.checkErrorRate();
        }, this.alertConfig.checkIntervalMinutes * 60 * 1000);
    }

    /**
     * Get Cloudinary usage tracking
     */
    getCloudinaryUsage(since?: Date): {
        totalFiles: number;
        totalSize: number;
        imageCount: number;
        audioCount: number;
        estimatedCost: number;
    } {
        const stats = this.getStatistics(since);

        // Cloudinary free tier: 25GB storage, 25GB bandwidth
        // Estimate cost based on usage (simplified)
        const totalSizeGB = stats.totalSize / (1024 * 1024 * 1024);
        const estimatedCost = totalSizeGB > 25 ? (totalSizeGB - 25) * 0.10 : 0;

        return {
            totalFiles: stats.successfulUploads,
            totalSize: stats.totalSize,
            imageCount: stats.imageUploads,
            audioCount: stats.audioUploads,
            estimatedCost
        };
    }

    /**
     * Get recent errors
     */
    getRecentErrors(limit: number = 10): Array<{
        timestamp: Date;
        filename: string;
        error: string;
        retryAttempt?: number;
    }> {
        return this.events
            .filter(e => e.type === UploadEventType.FAILURE)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit)
            .map(e => ({
                timestamp: e.timestamp,
                filename: e.filename,
                error: e.error || 'Unknown error',
                retryAttempt: e.retryAttempt
            }));
    }

    /**
     * Clear old events from memory (keep last 7 days)
     */
    clearOldEvents(): void {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        this.events = this.events.filter(e => e.timestamp >= sevenDaysAgo);

        console.log(`🧹 Cleared events older than 7 days`);
    }

    /**
     * Export statistics to JSON
     */
    exportStatistics(since?: Date): string {
        const stats = this.getStatistics(since);
        const usage = this.getCloudinaryUsage(since);
        const recentErrors = this.getRecentErrors(5);

        return JSON.stringify(
            {
                generatedAt: new Date().toISOString(),
                period: since ? `Since ${since.toISOString()}` : 'All time',
                statistics: stats,
                cloudinaryUsage: usage,
                recentErrors
            },
            null,
            2
        );
    }
}

// Export singleton instance
export const uploadMonitoringService = new UploadMonitoringService();
export default uploadMonitoringService;
