import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import ViteYaml from '@modyfi/vite-plugin-yaml';

import { cloudflare } from "@cloudflare/vite-plugin";
import { activityEditorPlugin } from "./tools/content-editor/vitePlugin";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    ViteYaml(),
    ...(mode === "editor" ? [] : [cloudflare()]),
    activityEditorPlugin(mode === "editor"),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    // editor.html is a local authoring tool and must never enter the deployed bundle.
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    },
  },
  server: {
    // HMR can be disabled via DISABLE_HMR when file watching is not desired.
    hmr: process.env.DISABLE_HMR !== 'true',
    port: 7230,
  },
}));
