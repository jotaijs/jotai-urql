import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  root: './tests/test-app',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    root: './tests',
    include: ['**/unit-tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
})
