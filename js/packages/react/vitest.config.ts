import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@opensourcenepal/nepali-calendar': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
        },
    },
    test: {
        environment: 'jsdom',
        include: ['test/**/*.test.tsx'],
    },
});
