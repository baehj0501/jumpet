import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
        resolve: {
            alias: {
                '@main': resolve('src/main'),
                '@shared': resolve('src/shared'),
            },
        },
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        resolve: {
            alias: {
                '@preload': resolve('src/preload'),
                '@shared': resolve('src/shared'),
            },
        },
    },
    renderer: {
        root: resolve('src/renderer'),
        resolve: {
            alias: {
                '@renderer': resolve('src/renderer/src'),
                '@shared': resolve('src/shared'),
            },
        },
        plugins: [react({ jsxImportSource: '@emotion/react' })],
        build: {
            rollupOptions: {
                input: {
                    index: resolve('src/renderer/index.html'),
                    menu: resolve('src/renderer/menu.html'),
                    world: resolve('src/renderer/world.html'),
                    youtube: resolve('src/renderer/youtube.html'),
                },
            },
        },
    },
})
