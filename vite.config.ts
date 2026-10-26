// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  base: './',
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0',
    cors: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
      },
    },
    watch: {
      ignored: ['**/.shogo/**', '**/external/**', '**/workspaces/**', '**/dist/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
  ],
  build: {
    target: 'esnext',
    minify: false,
  },
})
