import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@grandmagame/card-engine': fileURLToPath(new URL('../../packages/card-engine/src/index.ts', import.meta.url)),
      '@grandmagame/game-logic': fileURLToPath(new URL('../../packages/game-logic/src/index.ts', import.meta.url)),
      '@grandmagame/pixi-engine': fileURLToPath(new URL('../../packages/pixi-engine/src/index.ts', import.meta.url)),
      '@grandmagame/storage': fileURLToPath(new URL('../../packages/storage/src/index.ts', import.meta.url)),
      '@grandmagame/themes': fileURLToPath(new URL('../../packages/themes/src/index.ts', import.meta.url)),
      '@grandmagame/ui': fileURLToPath(new URL('../../packages/ui/src/index.ts', import.meta.url)),
    },
  },
})
