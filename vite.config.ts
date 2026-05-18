import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Базовая настройка для корректной работы ассетов на Vercel
  base: '/',
  build: {
    outDir: 'dist', // Убедимся, что сборка идет в папку dist
    emptyOutDir: true,
  },
});