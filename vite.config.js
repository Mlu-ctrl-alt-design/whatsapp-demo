import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const crmTarget = env.VITE_CRM_PROXY_TARGET || 'https://crm.thedaystar.co.za'

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Browser hits same-origin /crm/* → Vite forwards to the Daystar CRM,
        // bypassing browser CORS for the booth demo.
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
