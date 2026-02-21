import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Injects window.ECS_API_BASE so the app uses the Cloudflare Worker API (override with VITE_API_URL if needed).
function injectApiBase() {
  const apiUrl = (process.env.VITE_API_URL || 'https://wt2.btsjungarmy2007.workers.dev/api').replace(/"/g, '\\"');
  return {
    name: 'inject-api-base',
    transformIndexHtml(html) {
      return html.replace(
        '</head>',
        '<script>window.ECS_API_BASE="' + apiUrl + '";</script>\n</head>'
      );
    },
  };
}

export default defineConfig({
  plugins: [injectApiBase(), react()],
  assetsInclude: ['**/*.glb'],
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        lanyard: 'lanyard.html',
        login: 'login.html',
      },
    },
  },
});
