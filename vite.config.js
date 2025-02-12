import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/',
  publicDir: resolve(__dirname, 'public'),
  server: {
    fs: {
      strict: false
    }
  },
  build: {
    outDir: resolve(__dirname, './dist'),
    emptyOutDir: true,
    assetsDir: 'assets',
    target: 'es2015',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        helloworld: resolve(__dirname, 'helloworld.html'),
        hellofilter: resolve(__dirname, 'hellofilter.html')
      }
    }
  }
})
