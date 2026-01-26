# Monitoring System Quick Reference

Quick reference for using the upload monitoring and logging system.

## API Endpoints

All endpoints require admin authentication.

### Get Statistics
```bash
GET /api/monitoring/statistics
GET /api/monitoring/statistics?since=2025-11-27T00:00:00Z
```

Returns upload statistics including success/failure rates, average duration, and file counts.

### Get Daily Summary
```bash
GET /api/monitoring/daily-summary
GET /api/monitoring/daily-summary?date=2025-11-27
```

Returns comprehensive daily summary with top errors, largest files, and slowest uploads.

### Get Cloudinary Usage
```bash
GET /api/monitoring/cloudinary-usage
GET /api/monitoring/cloudinary-usage?since=2025-11-01
```

Returns Cloudinary usage statistics and estimated costs.

### Get Recent Errors
```bash
GET /api/monitoring/recent-errors
GET /api/monitoring/recent-errors?limit=20
```

Returns list of recent upload errors with timestamps and details.

### Export Statistics
```bash
GET /api/monitoring/export
GET /api/monitoring/export?since=2025-11-01
```

Downloads complete statistics as JSON file.

## Log Files

### Daily Upload Logs
**Location:** `logs/uploads/uploads-YYYY-MM-DD.log`

**Format:** JSON lines (one event per line)

**Example:**
```json
{"timestamp":"2025-11-27T10:30:45.123Z","type":"SUCCESS","fileType":"image","filename":"photo.jpg","size":524288,"duration":1250}
{"timestamp":"2025-11-27T10:31:12.456Z","type":"FAILURE","fileType":"image","filename":"failed.jpg","size":102400,"error":"Network timeout"}
```

### Daily Summary Files
**Location:** `logs/uploads/summary-YYYY-MM-DD.json`

**Format:** Complete JSON object

**Example:**
```json
{
  "date": "2025-11-27",
  "statistics": {
    "totalUploads": 100,
    "successfulUploads": 95,
    "failedUploads": 5,
    "errorRate": 5.0
  },
  "topErrors": [
    {"error": "Network timeout", "count": 3}
  ]
}
```

## Using the Service

### Import
```typescript
import { uploadMonitoringService } from './services/upload-monitoring.service';
```

### Get Current Statistics
```typescript
const stats = uploadMonitoringService.getStatistics();
console.log(`Error Rate: ${stats.errorRate.toFixed(2)}%`);
console.log(`Total Uploads: ${stats.totalUploads}`);
console.log(`Average Duration: ${stats.averageDuration}ms`);
```

### Get Statistics for Time Period
```typescript
// Last 24 hours
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
const recentStats = uploadMonitoringService.getStatistics(yesterday);

// Last week
const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const weekStats = uploadMonitoringService.getStatistics(lastWeek);
```

### Get Cloudinary Usage
```typescript
const usage = uploadMonitoringService.getCloudinaryUsage();
console.log(`Total Files: ${usage.totalFiles}`);
console.log(`Total Size: ${(usage.totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`);
console.log(`Estimated Cost: $${usage.estimatedCost.toFixed(2)}`);
```

### Get Recent Errors
```typescript
const errors = uploadMonitoringService.getRecentErrors(10);
errors.forEach(error => {
  console.log(`${error.timestamp}: ${error.filename} - ${error.error}`);
});
```

### Generate Daily Summary
```typescript
// Today's summary
const summary = uploadMonitoringService.generateDailySummary();

// Specific date
const date = new Date('2025-11-27');
const specificSummary = uploadMonitoringService.generateDailySummary(date);
```

### Export Statistics
```typescript
const json = uploadMonitoringService.exportStatistics();
fs.writeFileSync('upload-stats.json', json);
```

## Configure Alerts

### Basic Configuration
```typescript
uploadMonitoringService.configureAlerts({
  errorRateThreshold: 10, // Alert at 10% error rate
  checkIntervalMinutes: 30 // Check every 30 minutes
});
```

### Custom Alert Handler
```typescript
uploadMonitoringService.configureAlerts({
  errorRateThreshold: 5,
  checkIntervalMinutes: 15,
  alertCallback: (message, stats) => {
    // Send email
    sendEmailAlert({
      to: 'admin@example.com',
      subject: 'Upload Error Rate Alert',
      body: message
    });
    
    // Log to external service
    console.error(message);
  }
});
```

### Email Alerts
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({...});

uploadMonitoringService.configureAlerts({
  alertCallback: async (message, stats) => {
    await transporter.sendMail({
      from: 'alerts@example.com',
      to: 'admin@example.com',
      subject: 'Upload Error Rate Alert',
      text: message,
      html: `
        <h2>Upload Error Rate Alert</h2>
        <p>${message}</p>
        <h3>Statistics:</h3>
        <ul>
          <li>Total Uploads: ${stats.totalUploads}</li>
          <li>Failed: ${stats.failedUploads}</li>
          <li>Error Rate: ${stats.errorRate.toFixed(2)}%</li>
        </ul>
      `
    });
  }
});
```

### Slack Notifications
```typescript
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_TOKEN);

uploadMonitoringService.configureAlerts({
  alertCallback: async (message, stats) => {
    await slack.chat.postMessage({
      channel: '#alerts',
      text: message,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Upload Error Rate Alert*\n${message}`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Total Uploads:*\n${stats.totalUploads}`
            },
            {
              type: 'mrkdwn',
              text: `*Failed:*\n${stats.failedUploads}`
            },
            {
              type: 'mrkdwn',
              text: `*Error Rate:*\n${stats.errorRate.toFixed(2)}%`
            }
          ]
        }
      ]
    });
  }
});
```

## Statistics Reference

### UploadStatistics Object
```typescript
{
  totalUploads: number;        // Total upload attempts
  successfulUploads: number;   // Successful uploads
  failedUploads: number;       // Failed uploads
  retryAttempts: number;       // Total retry attempts
  totalSize: number;           // Total bytes uploaded
  averageDuration: number;     // Average upload time (ms)
  errorRate: number;           // Error rate percentage
  imageUploads: number;        // Image file count
  audioUploads: number;        // Audio file count
}
```

### DailySummary Object
```typescript
{
  date: string;                // Date (YYYY-MM-DD)
  statistics: UploadStatistics;
  topErrors: Array<{           // Top 5 errors
    error: string;
    count: number;
  }>;
  largestFiles: Array<{        // Top 5 largest files
    filename: string;
    size: number;
  }>;
  slowestUploads: Array<{      // Top 5 slowest uploads
    filename: string;
    duration: number;
  }>;
}
```

### CloudinaryUsage Object
```typescript
{
  totalFiles: number;          // Total files uploaded
  totalSize: number;           // Total bytes
  imageCount: number;          // Image count
  audioCount: number;          // Audio count
  estimatedCost: number;       // Estimated cost ($)
}
```

## Common Tasks

### Check Error Rate
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/monitoring/statistics | jq '.data.statistics.errorRate'
```

### Get Today's Summary
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/monitoring/daily-summary
```

### Export Last Month's Data
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:4000/api/monitoring/export?since=2025-11-01" \
  -o upload-stats.json
```

### View Recent Errors
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:4000/api/monitoring/recent-errors?limit=5" | jq '.data.errors'
```

## Troubleshooting

### No Statistics Showing
- Check that uploads are being made
- Verify monitoring service is initialized
- Check log files in `logs/uploads/`

### Alerts Not Triggering
- Verify error rate exceeds threshold
- Check alert configuration
- Ensure callback function is set
- Check cooldown period hasn't been triggered

### Log Files Not Created
- Verify `logs/uploads/` directory exists
- Check file permissions
- Ensure monitoring service is running

### High Memory Usage
- Run `clearOldEvents()` to remove old data
- Reduce retention period
- Implement log rotation

## Best Practices

1. **Regular Monitoring**
   - Check daily summaries
   - Review error trends weekly
   - Analyze usage monthly

2. **Alert Configuration**
   - Set appropriate thresholds
   - Use cooldown periods
   - Test alert system regularly

3. **Log Management**
   - Implement log rotation
   - Archive old logs
   - Monitor disk space

4. **Performance**
   - Clear old events periodically
   - Use time filters for queries
   - Export data for long-term storage

5. **Security**
   - Protect monitoring endpoints
   - Sanitize log data
   - Secure log file access

## Additional Resources

- Full documentation: `server/docs/MONITORING_SYSTEM.md`
- Task completion: `.kiro/specs/cloud-image-storage/TASK_16_COMPLETE.md`
- Test suite: `server/tests/test-monitoring-service.js`

---

**Last Updated:** 2025-11-27
