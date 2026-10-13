// Builds the add-in into dist/: the bundled scripts, the static pages and manifest.xml.
//
// ADDIN_BASE_URL is the https URL that dist/ is served from, ending in a slash. It defaults to the
// GitHub Pages site that .github/workflows/excel-addin.yml deploys to.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const baseUrl = process.env.ADDIN_BASE_URL || 'https://unicodist.github.io/OSN.NepaliCalendar/excel/';
if (!/^https:\/\/.+\/$/.test(baseUrl)) {
    throw new Error(`ADDIN_BASE_URL must be an https URL ending in /, not ${baseUrl}`);
}
const { version } = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

await build({
    entryPoints: {
        functions: new URL('src/register.ts', root).pathname,
        taskpane: new URL('src/taskpane.ts', root).pathname,
    },
    outdir: dist.pathname,
    bundle: true,
    format: 'iife',
    // Excel's custom functions runtime on older Windows builds runs an ES2017-era engine.
    target: 'es2017',
    minify: true,
    sourcemap: true,
    logLevel: 'warning',
});

cpSync(new URL('public/', root), dist, { recursive: true });
cpSync(new URL('src/functions.json', root), new URL('functions.json', dist));

// Point the pages at this version's scripts, so a browser or Office cache never pairs a new page with
// an old script.
for (const page of ['functions.html', 'taskpane.html']) {
    const file = new URL(page, dist);
    const html = readFileSync(file, 'utf8').replace(
        /(src|href)="(functions\.js|taskpane\.js|taskpane\.css)"/g,
        `$1="$2?v=${version}"`,
    );
    writeFileSync(file, html);
}

const manifest = readFileSync(new URL('manifest.template.xml', root), 'utf8')
    .replaceAll('{{BASE_URL}}', baseUrl)
    .replaceAll('{{ORIGIN}}', new URL(baseUrl).origin)
    .replaceAll('{{VERSION}}', `${version}.0`);
writeFileSync(new URL('manifest.xml', dist), manifest);

console.log(`Built the Excel add-in for ${baseUrl}`);
