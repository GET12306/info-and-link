import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import ViteYaml from '@modyfi/vite-plugin-yaml';

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const enableCloudflarePlugin = env.ENABLE_CLOUDFLARE_PLUGIN === 'true';
  const cloudflarePlugins = [];

  if (enableCloudflarePlugin) {
    const cloudflarePluginPackage = '@cloudflare/vite-plugin';
    const { cloudflare } = await import(cloudflarePluginPackage);
    cloudflarePlugins.push(cloudflare());
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      ViteYaml(),
      ...cloudflarePlugins,
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      port: 7230,
    },
  };
});
