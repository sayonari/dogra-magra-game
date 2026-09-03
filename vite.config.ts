import { defineConfig } from 'vite'
// GitHub Pages: https://sayonari.github.io/dogra-magra-game/  → base は repo 名
export default defineConfig({
  base: process.env.GH_PAGES ? '/dogra-magra-game/' : '/',
  build: { outDir: 'docs', emptyOutDir: true },
})
