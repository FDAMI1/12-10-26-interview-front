/**
 * Where the app finds things. EXPO_PUBLIC_* values are baked in at build time:
 * from interview-front/.env for `npm run web`, from the Vercel project settings
 * for the website, and from eas.json for the phone app.
 */
const ENV = {
  development: {
    apiUrl:
      process.env.EXPO_PUBLIC_API_URL_DEV || "http://localhost:6010/api/v1",
    webUrl: process.env.EXPO_PUBLIC_WEB_URL || "http://localhost:8081",
  },
  production: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:6010/api/v1",
    // The website, for links the phone app opens in a browser.
    webUrl: process.env.EXPO_PUBLIC_WEB_URL || "",
  },
};

export const environment = __DEV__ ? ENV.development : ENV.production;
