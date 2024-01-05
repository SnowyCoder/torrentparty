import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import wasmPack from 'vite-plugin-wasm-pack';
import windiCSS from 'vite-plugin-windicss';
import { fileURLToPath } from 'url';


// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      'events': 'eventemitter3',
      '@': fileURLToPath(new URL("./src", import.meta.url))
    },
  },
  plugins: [
    vue(),
    windiCSS(),
  ],
})
