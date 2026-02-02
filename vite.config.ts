import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    base: './',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                steamscout: resolve(__dirname, 'SteamScout/index.html'),
                time: resolve(__dirname, 'Time/index.html'),
                addTime: resolve(__dirname, 'Time/add-time.html'),
                subtractTime: resolve(__dirname, 'Time/subtract-time.html'),
                coc: resolve(__dirname, 'Coc/index.html'),
                counter: resolve(__dirname, 'Counter/index.html'),
                colorConverter: resolve(__dirname, 'ColorConverter/index.html'),
            },
        },
    },
});
