/**
 * Where the website sends people. Sign-in, sign-up and interviews live in the
 * Aivarnix app (the Expo web build), which talks to the existing API.
 */
const appUrl = (import.meta.env.VITE_APP_URL || "https://12-10-26-interview-front.vercel.app").replace(/\/+$/, "");

export const links = {
  app: appUrl,
  login: `${appUrl}/login`,
  signup: `${appUrl}/signup`,
  newInterview: `${appUrl}/interviews/new`,
  company: `${appUrl}/company`,
  privacy: `${appUrl}/privacy-policy.html`,
  deleteAccount: `${appUrl}/delete-account.html`,
};

/** Optional; shown only when configured, never invented. */
export const contactEmail = (import.meta.env.VITE_CONTACT_EMAIL || "").trim();
export const termsUrl = (import.meta.env.VITE_TERMS_URL || "").trim();
