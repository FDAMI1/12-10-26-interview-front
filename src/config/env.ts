import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Where the app finds things. EXPO_PUBLIC_* values are baked in at build time:
 * from interview-front/.env for `npm run web`, from the Vercel project settings
 * for the website, and from eas.json or the GitHub Action for the phone app.
 *
 * The phone app can also be pointed at another API at run time (Server
 * address on the sign-in screen), so one test APK works against a local
 * tunnel today and the deployed server tomorrow without a rebuild. The website
 * always uses its built-in address: it is served next to its own API.
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

const built = __DEV__ ? ENV.development : ENV.production;
const OVERRIDE_KEY = "api-url-override";
let override: string | null = null;

/** Whether this build lets the user change the server (phones, and local development). */
export const serverChangeAllowed = Platform.OS !== "web" || __DEV__;

export const environment = {
  get apiUrl() {
    return override || built.apiUrl;
  },
  get webUrl() {
    return built.webUrl;
  },
  builtApiUrl: built.apiUrl,
};

/**
 * "https://x.example.com" and "https://x.example.com/api/v1/" both mean the
 * same server; the app always talks to the /api/v1 root.
 */
export function normalizeApiUrl(input: string): string | null {
  const raw = input.trim().replace(/\/+$/, "");
  if (!/^https?:\/\/[^\s/]+/i.test(raw)) return null;
  return /\/api\/v1$/.test(raw) ? raw : `${raw}/api/v1`;
}

async function readStored(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return window.localStorage.getItem(OVERRIDE_KEY);
    return await SecureStore.getItemAsync(OVERRIDE_KEY);
  } catch {
    return null;
  }
}

/** Called once before the app renders. */
export async function loadServerOverride() {
  if (!serverChangeAllowed) return;
  override = await readStored();
}

/** `null` returns to the address the app was built with. */
export async function setServerOverride(url: string | null) {
  override = url;
  try {
    if (Platform.OS === "web") {
      if (url) window.localStorage.setItem(OVERRIDE_KEY, url);
      else window.localStorage.removeItem(OVERRIDE_KEY);
    } else if (url) await SecureStore.setItemAsync(OVERRIDE_KEY, url);
    else await SecureStore.deleteItemAsync(OVERRIDE_KEY);
  } catch {
    // Not persisted: the choice still holds until the app is closed.
  }
}
