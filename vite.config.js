import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Injects window.ECS_API_BASE for production. Set VITE_API_URL to your Render backend API base (e.g. https://your-app.onrender.com/api).
function injectApiBase() {
  const apiUrl = (process.env.VITE_API_URL || 'http://localhost:3000/api').replace(/"/g, '\\"');
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
