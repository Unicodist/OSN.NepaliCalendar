import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

const core = (path: string) => fileURLToPath(new URL(`../../core/${path}`, import.meta.url));

const config: StorybookConfig = {
    stories: ['../stories/**/*.stories.tsx'],
    framework: { name: '@storybook/react-vite', options: {} },
    core: { disableTelemetry: true },
    // Read the core package from source so Storybook works without building it first.
    viteFinal: (viteConfig) => ({
        ...viteConfig,
        resolve: {
            ...viteConfig.resolve,
            alias: {
                '@opensourcenepal/nepali-calendar/styles.css': core('styles.css'),
                '@opensourcenepal/nepali-calendar': core('src/index.ts'),
            },
        },
    }),
};

export default config;
