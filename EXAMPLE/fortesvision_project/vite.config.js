import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
    plugins: [
        vue({
            template: {
                transformAssetUrls: {
                    includeAbsolute: false,
                },
            },
        }),
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
            ]
        })
    ],
    resolve: {
        alias: {
            '@': path.join(__dirname, '/resources/js'), // Исправленный алиас
            '~': path.join(__dirname, '/node_modules'),
        },
    },
    build: {
        chunkSizeWarningLimit: 3200, // Лимит размера чанка
    },
});
