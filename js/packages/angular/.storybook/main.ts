import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@analogjs/storybook-angular';
import { mergeConfig, type UserConfig } from 'vite';

const core = (path: string) => fileURLToPath(new URL(`../../core/${path}`, import.meta.url));

const config: StorybookConfig = {
    stories: ['../stories/**/*.stories.ts'],
    framework: { name: '@analogjs/storybook-angular', options: {} },
    core: { disableTelemetry: true },
    // Read the core package from source so Storybook works without building it first.
    viteFinal: (viteConfig: UserConfig) =>
        mergeConfig(viteConfig, {
            resolve: {
                alias: {
                    '@opensourcenepal/nepali-calendar/styles.css': core('styles.css'),
                    '@opensourcenepal/nepali-calendar': core('src/index.ts'),
                },
            },
        }),
};

export default config;
