import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const hmrEnabled = process.env.DISABLE_HMR !== 'true';
  return {
    base: '/',
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      strictPort: true, // 固定端口，避免自动跳到 3001 导致 WS 连接拒绝
      // HMR 可通过 DISABLE_HMR=true 关闭；开启时固定 clientPort/port，避免 ERR_CONNECTION_REFUSED
      hmr: hmrEnabled
        ? { clientPort: 3000, port: 3000 }
        : false,
    },
  };
});
