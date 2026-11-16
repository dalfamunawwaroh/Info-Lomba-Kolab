// Menjalankan server (port 5000) dan client (port 3000) bersamaan dari root.
// Tanpa dependency tambahan; Ctrl+C menghentikan keduanya.
//  - Cek port bentrok sebelum mulai (penyebab umum ECONNREFUSED / server "diam").
//  - Client baru dinyalakan setelah server benar-benar menerima koneksi.
//  - Kalau server berhenti merespons, tampilkan peringatan jelas (bukan cuma
//    spam "http proxy error" dari Vite).
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERVER_PORT = 5000;
const CLIENT_PORT = 3000;
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const isPortOpen = (port) =>
  new Promise((resolve) => {
    const sock = net.connect({ port, host: '127.0.0.1' });
    sock.setTimeout(800);
    sock.once('connect', () => { sock.destroy(); resolve(true); });
    sock.once('timeout', () => { sock.destroy(); resolve(false); });
    sock.once('error', () => resolve(false));
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const children = [];
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

function start(name, color) {
  const child = spawn('npm run dev', {
    cwd: path.join(root, name),
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  const prefix = `${color}[${name}]${RESET} `;
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
    if (stopping) return;
    console.log(`${prefix}berhenti (kode ${code})`);
    shutdown(code ?? 0);
  });
  children.push(child);
  return child;
}

async function main() {
  for (const name of ['server', 'client']) {
    if (!existsSync(path.join(root, name, 'node_modules'))) {
      console.error(`${RED}[${name}] node_modules belum ada. Jalankan dulu: npm run install:all${RESET}`);
      process.exit(1);
    }
  }

  const busy = [];
  if (await isPortOpen(SERVER_PORT)) busy.push(SERVER_PORT);
  if (await isPortOpen(CLIENT_PORT)) busy.push(CLIENT_PORT);
  if (busy.length) {
    console.error(`${RED}Port ${busy.join(' & ')} masih dipakai proses lain (biasanya "npm run dev" lama yang belum tertutup).${RESET}`);
    console.error(`${RED}Tutup terminal lama, atau hentikan prosesnya di PowerShell:${RESET}`);
    busy.forEach((p) => console.error(`  Stop-Process -Id (Get-NetTCPConnection -LocalPort ${p} -State Listen).OwningProcess -Force`));
    process.exit(1);
  }

  start('server', '\x1b[36m');

  // Tunggu server siap (maks ~30 detik) sebelum menyalakan client
  let ready = false;
  for (let i = 0; i < 60 && !stopping; i++) {
    if (await isPortOpen(SERVER_PORT)) { ready = true; break; }
    await sleep(500);
  }
  if (!ready) {
    console.error(`${RED}[dev] Server tidak membuka port ${SERVER_PORT}. Periksa error [server] di atas.${RESET}`);
    shutdown(1);
    return;
  }

  start('client', '\x1b[35m');

  // Watchdog: beri tahu sekali saat server mati/restart, dan saat pulih lagi
  let down = false;
  setInterval(async () => {
    if (stopping) return;
    const up = await isPortOpen(SERVER_PORT);
    if (!up && !down) {
      down = true;
      console.error(`${YELLOW}[dev] ⚠ Server (port ${SERVER_PORT}) tidak merespons — halaman akan gagal memuat data. Lihat error [server] di atas; simpan ulang file server untuk memicu restart.${RESET}`);
    } else if (up && down) {
      down = false;
      console.log(`${YELLOW}[dev] ✔ Server aktif kembali.${RESET}`);
    }
  }, 3000);
}

main();
