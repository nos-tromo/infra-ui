import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  minify: false,
  splitting: false,
  external: ['react', 'react-dom'],
  tsconfig: 'tsconfig.build.json',
})
