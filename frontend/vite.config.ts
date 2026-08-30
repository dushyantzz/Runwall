import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor: React core (always needed)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase auth (loaded early but separable)
          'vendor-supabase': ['@supabase/supabase-js'],
          // XYFlow — heavy, only used on HomePage below-the-fold
          'vendor-xyflow': ['@xyflow/react'],
          // Radix UI primitives — used in modals/dropdowns (not on initial paint)
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
        },
      },
    },
  },
})
