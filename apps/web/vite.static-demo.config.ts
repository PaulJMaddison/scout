import { copyFileSync, existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const githubPagesBase = process.env.VITE_PAGES_BASE ?? '/universalcontextlayer/'
const staticDemoOutDir = 'dist-static-demo'

export default defineConfig({
  base: githubPagesBase,
  plugins: [
    react(),
    {
      name: 'static-demo-pages-fallbacks',
      closeBundle() {
        const htmlPath = resolve(staticDemoOutDir, 'static-demo.html')
        if (existsSync(htmlPath)) {
          copyFileSync(htmlPath, resolve(staticDemoOutDir, 'index.html'))
          copyFileSync(htmlPath, resolve(staticDemoOutDir, '404.html'))
        }
        writeFileSync(resolve(staticDemoOutDir, '.nojekyll'), '')
      },
    },
  ],
  build: {
    outDir: staticDemoOutDir,
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(new URL('./static-demo.html', import.meta.url)),
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5174,
  },
  preview: {
    port: 4174,
  },
})
