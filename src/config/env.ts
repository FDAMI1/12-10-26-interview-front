const ENV = {
  development: {
    apiUrl:
      process.env.EXPO_PUBLIC_API_URL_DEV || "http://localhost:5010/api/v1",
  },
  production: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:5010/api/v1",
  },
};

export const environment = __DEV__ ? ENV.development : ENV.production;
