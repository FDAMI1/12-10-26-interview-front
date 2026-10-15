/**
 * Runs before the website build on Vercel. The website's API address is baked
 * in at build time from EXPO_PUBLIC_API_URL; without it the site would call
 * http://localhost:6010 on every visitor's own computer. Fail the deploy with
 * a clear message instead.
 */
const url = process.env.EXPO_PUBLIC_API_URL || "";
if (!/^https:\/\/\S+$/.test(url) || /localhost|127\.0\.0\.1/.test(url)) {
  console.error(
    "\nEXPO_PUBLIC_API_URL is missing or not a public https address (got: " +
      JSON.stringify(url) +
      ").\nSet it in Vercel > Settings > Environment Variables to your API, e.g." +
      "\n  https://YOUR-SERVICE.onrender.com/api/v1\nthen redeploy. (EXPO_PUBLIC_API_URL_DEV is only for local development.)\n",
  );
  process.exit(1);
}
console.log(`Website will use the API at ${url}`);
