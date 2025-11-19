import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Явно говорим, что файлы parquet — это ресурсы
  assetsInclude: ['**/*.parquet'],
  build: {
    // Убеждаемся, что выходная папка стандартная
    outDir: 'dist',
  },
  // Убеждаемся, что пути работают от корня
  base: '/',
});
