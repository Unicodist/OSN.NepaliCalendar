#!/usr/bin/env node
// Builds and publishes the npm packages in dependency order: the core package first, because the
// React and Angular packages depend on it, then React and Angular. A version that is already on
// npm is skipped, so the script can be re-run after a partial failure.
//
// Usage (from js/):
//   npm run release -- [--dry-run] [--tag <tag>] [--otp <code>] [--only core,react,angular] [--skip-checks]
//
// Log in first with `npm login` (or set NPM_TOKEN in ~/.npmrc). Scoped packages are published
// with --access public.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// `dir` is the folder that is published: ng-packagr writes a ready-to-publish package to dist.
const PACKAGES = [
    { key: 'core', manifest: 'packages/core/package.json', dir: 'packages/core' },
    { key: 'react', manifest: 'packages/react/package.json', dir: 'packages/react' },
    { key: 'angular', manifest: 'packages/angular/package.json', dir: 'packages/angular/dist' },
];

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => {
    const index = args.indexOf(`--${name}`);
    return index >= 0 ? args[index + 1] : undefined;
};

const dryRun = flag('dry-run');
const tag = option('tag');
const otp = option('otp');
const only = option('only')?.split(',');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, commandArgs, options = {}) {
    console.log(`\n> ${command} ${commandArgs.join(' ')}`);
    return execFileSync(command, commandArgs, {
        cwd: root,
        stdio: 'inherit',
        shell: process.platform === 'win32',
        ...options,
    });
}

function readManifest(path) {
    return JSON.parse(readFileSync(join(root, path), 'utf8'));
}

function isPublished(name, version) {
    try {
        const out = execFileSync(npmCommand, ['view', `${name}@${version}`, 'version'], {
            cwd: root,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            shell: process.platform === 'win32',
        });
        return out.trim() === version;
    } catch {
        return false; // npm view exits non-zero when the package or version does not exist
    }
}

const selected = PACKAGES.filter((p) => !only || only.includes(p.key));
if (selected.length === 0) {
    console.error(`--only must list some of: ${PACKAGES.map((p) => p.key).join(', ')}`);
    process.exit(1);
}

// The React and Angular packages must ask for the core version being published, or npm would
// install an older core with them.
const core = readManifest('packages/core/package.json');
for (const pkg of PACKAGES.slice(1)) {
    const manifest = readManifest(pkg.manifest);
    const wanted = manifest.dependencies?.[core.name];
    const [major, minor, patch] = core.version.split('.');
    const ok = wanted === core.version || wanted === `^${core.version}` || wanted === `~${core.version}`;
    if (!ok) {
        console.error(
            `${manifest.name} depends on ${core.name}@${wanted}, but core is ${core.version}. ` +
                `Set it to "^${major}.${minor}.${patch}" before publishing.`,
        );
        process.exit(1);
    }
}

if (!dryRun) {
    try {
        const user = execFileSync(npmCommand, ['whoami'], {
            cwd: root,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            shell: process.platform === 'win32',
        }).trim();
        console.log(`Publishing to npm as ${user}.`);
    } catch {
        console.error('You are not logged in to npm. Run `npm login` first, or use --dry-run.');
        process.exit(1);
    }
}

if (!flag('skip-checks')) {
    run(npmCommand, ['run', 'lint']);
    run(npmCommand, ['run', 'typecheck']);
    run(npmCommand, ['test']);
}
run(npmCommand, ['run', 'build']);

const summary = [];
for (const pkg of selected) {
    // Read the manifest that is actually published (for Angular, the one ng-packagr wrote).
    const { name, version } = readManifest(join(pkg.dir, 'package.json'));
    if (isPublished(name, version)) {
        console.log(`\n${name}@${version} is already on npm, skipping.`);
        summary.push(`skipped   ${name}@${version} (already published)`);
        continue;
    }

    const publishArgs = ['publish', '--access', 'public'];
    if (tag) publishArgs.push('--tag', tag);
    if (otp) publishArgs.push('--otp', otp);
    if (dryRun) publishArgs.push('--dry-run');
    run(npmCommand, publishArgs, { cwd: join(root, pkg.dir) });
    summary.push(`${dryRun ? 'dry run  ' : 'published'} ${name}@${version}`);
}

console.log(`\n${summary.join('\n')}`);
