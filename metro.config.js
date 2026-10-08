// Metro config for Expo.
// The two resolver tweaks below are required for the Firebase JS SDK on Expo SDK 50+:
// without them, Metro's package-exports resolution picks a Firebase build that does NOT
// register the auth component on React Native. That causes
//   "Component auth has not been registered yet"
// and makes getReactNativePersistence resolve wrong (hence the AsyncStorage warning).
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("cjs");
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
