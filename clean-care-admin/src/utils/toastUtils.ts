import toast from 'react-hot-toast';

/**
 * Toast notification utilities for consistent messaging across the app
 */

export const showSuccessToast = (message: string, duration: number = 3000) => {
    return toast.success(message, {
        icon: '✅',
        duration,
        style: {
            background: '#4CAF50',
            color: '#fff',
        },
    });
};

export const showErrorToast = (message: string, duration: number = 5000) => {
    return toast.error(message, {
        icon: '❌',
        duration,
        style: {
            background: '#f44336',
            color: '#fff',
        },
    });
};

export const showInfoToast = (message: string, duration: number = 4000) => {
    return toast(message, {
        icon: 'ℹ️',
        duration,
        style: {
            background: '#2196F3',
            color: '#fff',
        },
    });
};

export const showWarningToast = (message: string, duration: number = 4000) => {
    return toast(message, {
        icon: '⚠️',
        duration,
        style: {
            background: '#FF9800',
            color: '#fff',
        },
    });
};

export const showNetworkErrorToast = (message: string = 'Network error. Please check your connection.') => {
    return toast.error(message, {
        icon: '📡',
        duration: 6000,
        style: {
            background: '#f44336',
            color: '#fff',
        },
    });
};

export const showLoadingToast = (message: string) => {
    return toast.loading(message, {
        style: {
            background: '#363636',
            color: '#fff',
        },
    });
};

export const dismissToast = (toastId: string) => {
    toast.dismiss(toastId);
};

export const dismissAllToasts = () => {
    toast.dismiss();
};
