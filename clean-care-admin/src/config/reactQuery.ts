/**
 * React Query Configuration
 * 
 * Configures React Query for data fetching and caching
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create and configure React Query client
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Cache time: 5 minutes
            staleTime: 5 * 60 * 1000,

            // Garbage collection time: 10 minutes
            gcTime: 10 * 60 * 1000,

            // Retry failed requests 3 times
            retry: 3,

            // Retry delay with exponential backoff
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

            // Refetch on window focus
            refetchOnWindowFocus: false,

            // Refetch on reconnect
            refetchOnReconnect: true,

            // Refetch on mount if data is stale
            refetchOnMount: true,
        },
        mutations: {
            // Retry failed mutations once
            retry: 1,

            // Retry delay
            retryDelay: 1000,
        },
    },
});

/**
 * Query keys for consistent cache management
 */
export const queryKeys = {
    // User management
    users: {
        all: ['users'] as const,
        list: (filters?: any) => ['users', 'list', filters] as const,
        detail: (id: number) => ['users', 'detail', id] as const,
        statistics: (filters?: any) => ['users', 'statistics', filters] as const,
    },

    // Admin management
    admins: {
        all: ['admins'] as const,
        list: (filters?: any) => ['admins', 'list', filters] as const,
        detail: (id: number) => ['admins', 'detail', id] as const,
        statistics: (filters?: any) => ['admins', 'statistics', filters] as const,
    },

    // Super admin management
    superAdmins: {
        all: ['superAdmins'] as const,
        list: (filters?: any) => ['superAdmins', 'list', filters] as const,
        detail: (id: number) => ['superAdmins', 'detail', id] as const,
        statistics: (filters?: any) => ['superAdmins', 'statistics', filters] as const,
    },

    // Complaints
    complaints: {
        all: ['complaints'] as const,
        list: (filters?: any) => ['complaints', 'list', filters] as const,
        detail: (id: number) => ['complaints', 'detail', id] as const,
        statistics: (filters?: any) => ['complaints', 'statistics', filters] as const,
    },

    // Chat
    chat: {
        all: ['chat'] as const,
        list: (filters?: any) => ['chat', 'list', filters] as const,
        messages: (complaintId: number, page?: number) =>
            ['chat', 'messages', complaintId, page] as const,
        statistics: () => ['chat', 'statistics'] as const,
    },

    // Dashboard
    dashboard: {
        statistics: (filters?: any) => ['dashboard', 'statistics', filters] as const,
    },

    // Activity logs
    activityLogs: {
        all: ['activityLogs'] as const,
        list: (filters?: any) => ['activityLogs', 'list', filters] as const,
    },

    // City corporations
    cityCorporations: {
        all: ['cityCorporations'] as const,
        list: () => ['cityCorporations', 'list'] as const,
        detail: (code: string) => ['cityCorporations', 'detail', code] as const,
    },

    // Zones
    zones: {
        all: ['zones'] as const,
        list: (cityCorporationCode?: string) =>
            ['zones', 'list', cityCorporationCode] as const,
        detail: (id: number) => ['zones', 'detail', id] as const,
    },

    // Wards
    wards: {
        all: ['wards'] as const,
        list: (zoneId?: number) => ['wards', 'list', zoneId] as const,
        detail: (id: number) => ['wards', 'detail', id] as const,
    },
};

/**
 * Cache invalidation helpers
 */
export const invalidateQueries = {
    users: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
    admins: () => queryClient.invalidateQueries({ queryKey: queryKeys.admins.all }),
    superAdmins: () => queryClient.invalidateQueries({ queryKey: queryKeys.superAdmins.all }),
    complaints: () => queryClient.invalidateQueries({ queryKey: queryKeys.complaints.all }),
    chat: () => queryClient.invalidateQueries({ queryKey: queryKeys.chat.all }),
    dashboard: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    activityLogs: () => queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs.all }),
    all: () => queryClient.invalidateQueries(),
};

/**
 * Prefetch helpers for optimistic loading
 */
export const prefetchQueries = {
    users: async (filters?: any) => {
        await queryClient.prefetchQuery({
            queryKey: queryKeys.users.list(filters),
            queryFn: () => {
                // This will be implemented in the service layer
                return Promise.resolve([]);
            },
        });
    },

    complaints: async (filters?: any) => {
        await queryClient.prefetchQuery({
            queryKey: queryKeys.complaints.list(filters),
            queryFn: () => {
                // This will be implemented in the service layer
                return Promise.resolve([]);
            },
        });
    },
};
