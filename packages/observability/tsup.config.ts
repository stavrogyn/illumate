import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    node: 'src/node.ts',
    browser: 'src/browser.ts',
    nestjs: 'src/nestjs/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: {
    // Skip type checking for faster builds during development
    compilerOptions: {
      skipLibCheck: true,
    },
  },
  sourcemap: true,
  clean: true,
  external: [
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/config',
    '@nestjs/swagger',
    'next',
    'react',
    'react-dom',
    'express',
  ],
  noExternal: [],
  treeshake: true,
  splitting: false,
})

