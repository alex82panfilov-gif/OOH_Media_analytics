import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public', // Явно говорим Vite брать файлы отсюда
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  base: '/',
});
