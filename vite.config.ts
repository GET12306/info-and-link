import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import ViteYaml from '@modyfi/vite-plugin-yaml';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ViteYaml(),
    cloudflare(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // HMR can be disabled via DISABLE_HMR when file watching is not desired.
    hmr: process.env.DISABLE_HMR !== 'true',
    port: 7230,
  },
});
