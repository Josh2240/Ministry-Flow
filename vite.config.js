import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dotenv from 'dotenv'
import apiHandler from './api/[...path].js'

dotenv.config({ path: '.env.local' })

function localApi() {
  return {
    name: 'ministry-flow-local-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        Promise.resolve(apiHandler(req, res)).catch(next)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [react(), localApi()],
})
