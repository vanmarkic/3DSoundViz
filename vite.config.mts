import { defineConfig } from 'vite'
import * as path from 'path'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

// Electron plugins disabled - use npm run dev for browser mode
// Electron mode uses separate build process (npm run dev:electron)
const plugins: any[] = []

// Uncomment below to enable auto-electron mode (currently has module resolution issues)
// if (process.env.ELECTRON !== 'true') {
//   try {
//     plugins.push(
//       electron([...]),
//       renderer()
//     )
//   } catch (e) {
//     // Electron plugins not installed (optional dependency)
//   }
// }

export default defineConfig({
  // Use relative path for Electron, absolute for GitHub Pages
  base: process.env.ELECTRON === 'true' ? './' :
        process.env.NODE_ENV === 'production' ? '/3DSoundViz/' : '/',
  plugins,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@services': path.resolve(__dirname, './src/services'),
      '@core': path.resolve(__dirname, './src/core'),
      '@visuals': path.resolve(__dirname, './src/visuals'),
      '@audio': path.resolve(__dirname, './src/audio'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@physics': path.resolve(__dirname, './src/physics'),
      '@shaders': path.resolve(__dirname, './src/shaders')
    }
  },
  assetsInclude: ['**/*.glsl'],
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
