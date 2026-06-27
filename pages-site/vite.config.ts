import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { sourceidPlugin } from './server/vite-plugin-sourceid';
import * as path from 'path';

export default defineConfig({
  plugins: [
    sourceidPlugin({
      pagesRoot: path.resolve(__dirname, 'src/pages'),
    }),
    tailwindcss(),
    react(),
  ],
  server: {
    port: 5174,
    cors: {
      origin: 'http://localhost:5173',
    },
  },
});
