// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // The marketing website is its own Vite project with its own lint setup.
    ignores: ["dist/*", "website/**"],
  },
]);
