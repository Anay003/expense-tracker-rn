const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Handle @/* and @/assets/* path aliases from tsconfig.json
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@/assets/')) {
    const targetPath = path.resolve(__dirname, 'assets', moduleName.replace(/^@\/assets\//, ''));
    return context.resolveRequest(context, targetPath, platform);
  }
  if (moduleName.startsWith('@/')) {
    const targetPath = path.resolve(__dirname, 'src', moduleName.replace(/^@\//, ''));
    return context.resolveRequest(context, targetPath, platform);
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
