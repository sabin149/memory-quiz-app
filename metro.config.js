const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname)

// Prefer CommonJS entries when packages dual-publish. Metro's web output is a
// classic script, so ESM-only syntax like zustand v5's `import.meta` breaks
// the whole bundle at parse time (blank page in production web builds).
config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

module.exports = withNativeWind(config, { input: './app/globals.css' })
