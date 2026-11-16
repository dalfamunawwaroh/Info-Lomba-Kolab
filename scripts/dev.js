// Menjalankan server (port 5000) dan client (port 3000) bersamaan dari root.
// Tanpa dependency tambahan; Ctrl+C menghentikan keduanya.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apps = [
  { name: 'server', color: '\x1b[36m' },
  { name: 'client', color: '\x1b[35m' },
];

for (const app of apps) {
  if (!existsSync(path.join(root, app.name, 'node_modules'))) {
    console.error(`\x1b[31m[${app.name}] node_modules belum ada. Jalankan dulu: npm run install:all\x1b[0m`);
    process.exit(1);
  }
}

const children = apps.map(({ name, color }) => {
  const child = spawn('npm run dev', {
    cwd: path.join(root, name),
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  const prefix = `${color}[${name}]\x1b[0m `;
  const pipe = (stream, out) => {
    let buf = '';
    stream.on('data', (chunk) => {
      buf += chunk.toString();
      const lines = buf.split(/\r?\n/);
      buf = lines.pop();
      lines.forEach((l) => out.write(prefix + l + '\n'));
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code) => {
    console.log(`${prefix}berhenti (kode ${code})`);
    shutdown(code ?? 0);
  });
  return child;
});

let stopping = false;
function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const c of children) {
    if (c.exitCode === null) {
      if (process.platform === 'win32') spawn('taskkill', ['/pid', String(c.pid), '/T', '/F']);
      else c.kill('SIGINT');
    }
  }
  setTimeout(() => process.exit(code), 500);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
