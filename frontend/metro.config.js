const { getDefaultConfig } = require('expo/metro-config');

// SDK 54+ auto-detects monorepo structure
const config = getDefaultConfig(__dirname);

// Explicitly ensure projectRoot is this app, not the monorepo root
config.projectRoot = __dirname;

// Keep classic Metro resolution to support packages that ship extensionless ESM imports.
config.resolver.unstable_enablePackageExports = false;
config.resolver.sourceExts = [...new Set([...(config.resolver.sourceExts ?? []), 'cjs', 'mjs'])];

module.exports = config;
