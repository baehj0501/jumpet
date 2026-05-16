import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
        resolve: {
            alias: {
                '@main': resolve('src/main'),
            },
        },
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        resolve: {
            alias: {
                '@preload': resolve('src/preload'),
            },
        },
    },
    renderer: {
        root: resolve('src/renderer'),
        resolve: {
            alias: {
                '@renderer': resolve('src/renderer/src'),
            },
        },
        plugins: [react()],
        build: {
            rollupOptions: {
                input: {
                    index: resolve('src/renderer/index.html'),
                },
            },
        },
    },
})
