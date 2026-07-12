import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import reactScan from '@react-scan/vite-plugin-react-scan';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    react(),
    reactScan(),
  ],
  build: {
    sourcemap: true,
  },
});
