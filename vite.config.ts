import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Явно указываем папку public
  publicDir: 'public',
  build: {
    outDir: 'dist',
    // Отключаем лимит на размер чанков, чтобы не было желтых предупреждений
    chunkSizeWarningLimit: 1600,
  },
  base: '/',
});
