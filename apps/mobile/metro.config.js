const { getDefaultConfig } = require('expo/metro-config');

// SDK 54+ auto-detects monorepo structure
const config = getDefaultConfig(__dirname);

// Explicitly ensure projectRoot is this app, not the monorepo root
config.projectRoot = __dirname;

module.exports = config;
