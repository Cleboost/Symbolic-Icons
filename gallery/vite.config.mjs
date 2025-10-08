import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'symbolic-icons': path.resolve(process.cwd(), '../dist/index.js'),
    },
  },
})


