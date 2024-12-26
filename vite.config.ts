import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig({
  root: path.join(__dirname, 'src/renderer/cosme-x'), // 指定前端入口
  base: './', // 打包后可以使用相对路径
  plugins: [react()],
  build: {
    outDir: path.join(__dirname, 'dist/renderer'), // 输出到 dist/renderer
    emptyOutDir: true,
    rollupOptions: {
      // 入口文件
      input: {
        main: path.join(__dirname, 'src/renderer/cosme-x/index.html')
      }
    }
  },
  server: {
    // 开发服务器端口
    port: 5173,
    strictPort: true
  }
});
