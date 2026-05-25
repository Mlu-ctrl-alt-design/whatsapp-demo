import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const crmTarget = env.VITE_CRM_PROXY_TARGET || 'https://crm.thedaystar.co.za'
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3001'

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Browser hits same-origin /api/* → our backend (npm run server),
        // which owns persistence and forwards to the CRM server-side.
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        // Legacy direct-to-CRM proxy. Kept so the old client path still
        // works during the migration; can be deleted once nothing uses it.
        '/crm': {
          target: crmTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/crm/, ''),
        },
      },
    },
  }
})
