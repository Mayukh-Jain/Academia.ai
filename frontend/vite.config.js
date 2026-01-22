import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Tell Vite to IGNORE these backend folders so it doesn't reload
      ignored: ['**/static/**', '**/__pycache__/**', '**/*.pdf', '**/*.mp3']
    }
  }
})