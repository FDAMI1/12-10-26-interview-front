const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// website/ is a separate Vite project (the marketing site). Keep the Expo
// bundler away from it and its own node_modules.
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const websiteDir = escape(path.join(__dirname, "website")).replace(/\\\\/g, "[\\\\/]");
config.resolver.blockList = [new RegExp(`^${websiteDir}[\\\\/]`)];

module.exports = config;
