#!/usr/bin/env node
// npm has no release-notes field: a package page shows only its README. So before the packages are
// built and packed, this adds the release's entry from the repository's CHANGELOG.md to the top of
// each package README as "What's new in <version>", and writes a CHANGELOG.md with every npm
// release into each package so it ships in the tarball.
//
// publish.mjs calls applyReleaseNotes() and undoes it after publishing. The release workflow runs
// this file directly (`node scripts/package-notes.mjs`) on its throwaway checkout.

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const changelogPath = join(root, '..', 'CHANGELOG.md');
const changelogUrl = 'https://github.com/Unicodist/OSN.NepaliCalendar/blob/main/CHANGELOG.md';
const releasesUrl = 'https://github.com/Unicodist/OSN.NepaliCalendar/releases';

const PACKAGE_DIRS = ['packages/core', 'packages/react', 'packages/angular'];

/** The npm entries of CHANGELOG.md, newest first: `## npm 1.2.0 (2026-10-11)` and the text below it. */
export function npmEntries(changelog) {
    const entries = [];
    let current;
    for (const line of changelog.split('\n')) {
        const heading = /^## (\S+) (\S+) \((\d{4}-\d{2}-\d{2})\)\s*$/.exec(line);
        if (heading) {
            current = { kind: heading[1], version: heading[2], date: heading[3], lines: [] };
            entries.push(current);
        } else if (current) {
            current.lines.push(line);
        }
    }
    return entries
        .filter((e) => e.kind === 'npm')
        .map(({ version, date, lines }) => ({ version, date, body: lines.join('\n').trim() }));
}

/** The README with a "What's new" section for `entry` before its first `##` heading. */
export function withWhatsNew(readme, entry) {
    const section = [
        `## What's new in ${entry.version}`,
        '',
        `_Released ${entry.date}._`,
        '',
        entry.body,
        '',
        `Earlier versions are listed in the [changelog](${changelogUrl}) and on the [GitHub releases](${releasesUrl}) page.`,
        '',
        '',
    ].join('\n');
    const index = readme.search(/^## /m);
    return index < 0 ? `${readme.trimEnd()}\n\n${section}` : readme.slice(0, index) + section + readme.slice(index);
}

/** The npm-only changelog shipped in each package. */
export function packageChangelog(entries) {
    const parts = [
        '# Changelog',
        '',
        `Releases of the npm packages, newest first. The full history, including the .NET package, is in the [repository changelog](${changelogUrl}).`,
    ];
    for (const e of entries) parts.push('', `## ${e.version} (${e.date})`, '', e.body);
    return `${parts.join('\n')}\n`;
}

/**
 * Adds the notes for `version` to each package README and writes each package's CHANGELOG.md.
 * Returns a function that puts the READMEs back and removes the CHANGELOG.md files.
 */
export function applyReleaseNotes(version) {
    const entries = npmEntries(readFileSync(changelogPath, 'utf8'));
    const entry = entries.find((e) => e.version === version);
    if (!entry) {
        throw new Error(
            `CHANGELOG.md has no "## npm ${version} (date)" entry, so npm would show no notes for ${version}. ` +
                'Pull main after the release workflow has run, or add the entry by hand.',
        );
    }

    const originals = [];
    for (const dir of PACKAGE_DIRS) {
        const readmePath = join(root, dir, 'README.md');
        const readme = readFileSync(readmePath, 'utf8');
        originals.push([readmePath, readme]);
        writeFileSync(readmePath, withWhatsNew(readme, entry));
        writeFileSync(join(root, dir, 'CHANGELOG.md'), packageChangelog(entries));
    }
    console.log(`Added the ${version} release notes to the package READMEs and changelogs.`);

    return () => {
        for (const [path, text] of originals) writeFileSync(path, text);
        for (const dir of PACKAGE_DIRS) {
            const path = join(root, dir, 'CHANGELOG.md');
            if (existsSync(path)) rmSync(path);
        }
    };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const version = JSON.parse(readFileSync(join(root, 'packages/core/package.json'), 'utf8')).version;
    try {
        applyReleaseNotes(version);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}
