/**
 * Browser Notification Utility
 * Handles browser push notifications for new messages
 */

export class BrowserNotificationService {
    private static instance: BrowserNotificationService;
    private permissionGranted: boolean = false;

    private constructor() {
        this.checkPermission();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): BrowserNotificationService {
        if (!BrowserNotificationService.instance) {
            BrowserNotificationService.instance = new BrowserNotificationService();
        }
        return BrowserNotificationService.instance;
    }

    /**
     * Check if browser notifications are supported
     */
    public isSupported(): boolean {
        return 'Notification' in window;
    }

    /**
     * Check current permission status
     */
    private checkPermission(): void {
        if (this.isSupported()) {
            this.permissionGranted = Notification.permission === 'granted';
        }
    }

    /**
     * Request notification permission from user
     */
    public async requestPermission(): Promise<boolean> {
        if (!this.isSupported()) {
            console.warn('Browser notifications are not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.permissionGranted = true;
            return true;
        }

        if (Notification.permission === 'denied') {
            console.warn('Notification permission was denied');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permissionGranted = permission === 'granted';
            return this.permissionGranted;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    /**
     * Show a browser notification for a new message
     */
    public showNotification(
        title: string,
        options: {
            body: string;
            icon?: string;
            badge?: string;
            tag?: string;
            data?: any;
            requireInteraction?: boolean;
        }
    ): Notification | null {
        if (!this.isSupported() || !this.permissionGranted) {
            return null;
        }

        try {
            const notification = new Notification(title, {
                ...options,
                icon: options.icon || '/favicon.png',
                badge: options.badge || '/favicon.png',
                requireInteraction: options.requireInteraction ?? false,
            });

            return notification;
        } catch (error) {
            console.error('Error showing notification:', error);
            return null;
        }
    }

    /**
     * Show notification for new chat message
     */
    public showNewMessageNotification(
        senderName: string,
        messagePreview: string,
        complaintId: number,
        trackingNumber: string,
        onClick?: () => void
    ): Notification | null {
        const notification = this.showNotification(
            `New message from ${senderName}`,
            {
                body: messagePreview,
                tag: `chat-${complaintId}`, // Prevents duplicate notifications for same chat
                data: {
                    complaintId,
                    trackingNumber,
                    type: 'new-message',
                },
                requireInteraction: false,
            }
        );

        if (notification && onClick) {
            notification.onclick = () => {
                window.focus();
                onClick();
                notification.close();
            };
        }

        return notification;
    }

    /**
     * Get permission status
     */
    public getPermissionStatus(): NotificationPermission {
        if (!this.isSupported()) {
            return 'denied';
        }
        return Notification.permission;
    }

    /**
     * Check if permission is granted
     */
    public hasPermission(): boolean {
        return this.permissionGranted;
    }
}

// Export singleton instance
export const browserNotifications = BrowserNotificationService.getInstance();
