import { defineConfig } from 'vite';
import path from 'path';

/**
 * Vite configuration for bundling Paired Comments extension for browser
 *
 * This bundles the VS Code extension to work in Monaco Editor in the browser
 * by replacing VS Code API imports with our shim implementation.
 */
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, '../src/extension-browser.ts'),
      name: 'PairedCommentsExtension',
      fileName: (format) => `paired-comments-extension.${format}.js`,
      formats: ['es', 'umd'],
    },
    outDir: path.resolve(__dirname, 'public/extension'),
    sourcemap: true,
    minify: false, // Keep readable for debugging
    rollupOptions: {
      // External dependencies that will be provided by the browser environment
      external: ['vscode'],
      output: {
        globals: {
          vscode: 'vscode', // Our shim will provide this global
        },
      },
    },
  },
  resolve: {
    alias: {
      // Alias vscode module to our browser shim
      vscode: path.resolve(__dirname, 'src/lib/vscode-shim/index.ts'),
      // Alias extension source files
      '@': path.resolve(__dirname, '../src'),
    },
  },
  define: {
    // Define Node.js globals for browser
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['vscode'],
  },
});
