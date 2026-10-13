// Serves dist/ at https://localhost:3000/ for sideloading a local build.
//
// Build for it with `ADDIN_BASE_URL=https://localhost:3000/ npm run build`. Office needs a trusted
// certificate: run `npx office-addin-dev-certs install` once, which writes the files read below.
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:https';
import { homedir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT || 3000);
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const certs = join(homedir(), '.office-addin-dev-certs');
const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.xml': 'application/xml; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
};

if (!existsSync(join(certs, 'localhost.crt'))) {
    console.error('No certificate found. Run `npx office-addin-dev-certs install` first.');
    process.exit(1);
}

createServer(
    { cert: readFileSync(join(certs, 'localhost.crt')), key: readFileSync(join(certs, 'localhost.key')) },
    (request, response) => {
        const path = normalize(decodeURIComponent(new URL(request.url ?? '/', 'https://localhost').pathname));
        const file = join(dist, path === '/' ? 'taskpane.html' : path);
        if (!file.startsWith(dist) || !existsSync(file) || !statSync(file).isFile()) {
            response.writeHead(404).end();
            return;
        }
        response.writeHead(200, {
            'Content-Type': types[extname(file)] ?? 'application/octet-stream',
            'Access-Control-Allow-Origin': '*',
        });
        createReadStream(file).pipe(response);
    },
).listen(port, () => console.log(`Serving ${dist} at https://localhost:${port}/`));
