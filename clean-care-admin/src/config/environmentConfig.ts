interface EnvironmentConfig {
  API_BASE_URL: string;
  NODE_ENV: string;
  VITE_APP_NAME: string;
  VITE_MAP_API_KEY: string;
  VITE_WEBSOCKET_URL: string;
  VITE_ENABLE_DEV_TOOLS: boolean;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  return {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
    NODE_ENV: import.meta.env.NODE_ENV || 'development',
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'Clean Care Admin',
    VITE_MAP_API_KEY: import.meta.env.VITE_MAP_API_KEY || '',
    VITE_WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001',
    VITE_ENABLE_DEV_TOOLS: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true' || import.meta.env.NODE_ENV === 'development',
  };
};

export const ENV = getEnvironmentConfig();

export const isDevelopment = ENV.NODE_ENV === 'development';
export const isProduction = ENV.NODE_ENV === 'production';
export const isTest = ENV.NODE_ENV === 'test';