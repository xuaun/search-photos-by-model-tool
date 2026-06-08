import vue from '@vitejs/plugin-vue';
import express from 'express';
import {fileURLToPath, URL} from 'node:url';
import {defineConfig, Plugin} from 'vite';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import editorServer from './server/index.js';

// Mounts the editor's local file API (server/index.js) onto the Vite dev
// server, replacing the old webpack `devServer.before` hook.
function editorApiPlugin(): Plugin {
    return {
        name: 'editor-api',
        configureServer(server) {
            const app = express();
            editorServer(app);
            server.middlewares.use(app);
        },
    };
}

export default defineConfig({
    base: './',
    plugins: [
        vue(),
        editorApiPlugin(),
        viteStaticCopy({
            targets: [
                {src: 'static', dest: '.'},
                {src: 'favicon.ico', dest: '.'},
            ],
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        port: 8080,
        watch: {
            // Python virtualenvs accidentally placed under src/ contain tens of
            // thousands of files; watching them causes a reload storm that breaks
            // dynamic imports. Ignore them.
            ignored: ['**/venv/**', '**/venv311/**', '**/site-packages/**', '**/__pycache__/**'],
        },
    },
});
