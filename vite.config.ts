import { defineConfig } from 'vite'
import path from 'path'

// Try to import electron plugins, but don't fail if they're not available
let electron: any
let renderer: any
try {
  electron = require('vite-plugin-electron').default
  renderer = require('vite-plugin-electron-renderer').default
} catch (e) {
  console.log('Electron plugins not available, running in browser mode')
}

const plugins: any[] = []

// Add electron plugins if available
if (electron && renderer) {
  plugins.push(
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron']
            }
          }
        }
      },
      {
        entry: 'electron/preload.ts',
        vite: {
          build: {
            outDir: 'dist-electron'
          }
        },
        onstart(options) {
          options.reload()
        }
      }
    ]),
    renderer()
  )
}

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@services': path.resolve(__dirname, './src/services'),
      '@core': path.resolve(__dirname, './src/core'),
      '@visuals': path.resolve(__dirname, './src/visuals'),
      '@audio': path.resolve(__dirname, './src/audio'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true
  },
  optimizeDeps: {
    exclude: ['electron']
  }
})
