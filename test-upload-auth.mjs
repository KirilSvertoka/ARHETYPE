import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.TEST_PORT || '34567';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'arhetype-upload-'));
const dbPath = path.join(tmp, 'test.db');
const uploadDir = path.join(tmp, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['tsx', 'server.ts'], {
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT,
        DATABASE_PATH: dbPath,
        UPLOAD_DIR: uploadDir,
        ADMIN_USERNAME: 'admin',
        ADMIN_PASSWORD: 'testpass123',
        APP_URL: 'http://127.0.0.1:' + PORT,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';
    const onData = (buf) => {
      output += buf.toString();
      if (output.includes('Server running')) {
        child.stdout.off('data', onData);
        child.stderr.off('data', onData);
        resolve(child);
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', (code) => {
      reject(new Error(`Server exited early (${code}): ${output.slice(-2000)}`));
    });
    setTimeout(() => reject(new Error(`Server start timeout: ${output.slice(-2000)}`)), 60000);
  });
}

async function stopServer(child) {
  if (!child || child.killed) return;
  child.removeAllListeners('exit');
  child.kill('SIGTERM');
  await new Promise((resolve) => {
    const t = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 5000);
    child.on('exit', () => {
      clearTimeout(t);
      resolve();
    });
  });
}

async function api(pathname, options = {}) {
  const res = await fetch(`http://127.0.0.1:${PORT}${pathname}`, options);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function run() {
  let child;
  try {
    child = await startServer();

    const unauth = await api('/api/upload', { method: 'POST' });
    assert(unauth.status === 401, `expected 401 without token, got ${unauth.status}`);

    const badLogin = await api('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrong' }),
    });
    assert(badLogin.status === 401, `expected 401 for bad login, got ${badLogin.status}`);

    const login = await api('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'testpass123' }),
    });
    assert(login.status === 200 && login.body?.token, `login failed: ${JSON.stringify(login)}`);
    const token = login.body.token;

    const session = await api('/api/admin/session', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(session.status === 200 && session.body?.ok, `session check failed: ${JSON.stringify(session)}`);

    const form = new FormData();
    form.append('image', new Blob([PNG_1X1], { type: 'image/png' }), 'главное фото.png');
    const uploaded = await api('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    assert(uploaded.status === 200 && uploaded.body?.url?.startsWith('/uploads/'), `upload failed: ${JSON.stringify(uploaded)}`);
    const imageUrl = uploaded.body.url;
    const filename = imageUrl.replace('/uploads/', '');
    assert(fs.existsSync(path.join(uploadDir, filename)), `uploaded file missing: ${filename}`);
    assert(/^\d+-[a-f0-9]+\.png$/.test(filename), `unsafe filename: ${filename}`);

    const created = await api('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Test Perfume',
        brand: 'ARHETYPE',
        description: 'Test description',
        imageUrl,
        images: [imageUrl],
        price: '10',
        topNotes: [],
        heartNotes: [],
        baseNotes: [],
        gender: 'Unisex',
        scentFamilies: [],
        concentration: 'EDP',
        stockThreshold: 5,
        tags: [],
        season: [],
        variants: [{ size: '10 ml', price: 10, stock: 3, sku: 'TEST-10', variant_type: 'decant' }],
      }),
    });
    assert(created.status === 200 || created.status === 201, `create product failed: ${JSON.stringify(created)}`);

    const products = await api('/api/products');
    assert(products.status === 200, `list products failed: ${products.status}`);
    const product = (products.body || []).find((p) => p.imageUrl === imageUrl);
    assert(product, 'created product not found in catalog with new imageUrl');
    assert(Array.isArray(product.images) && product.images[0] === imageUrl, 'gallery image was not persisted');

    await stopServer(child);
    child = await startServer();

    const sessionAfterRestart = await api('/api/admin/session', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(
      sessionAfterRestart.status === 200 && sessionAfterRestart.body?.ok,
      `session did not survive restart: ${JSON.stringify(sessionAfterRestart)}`,
    );

    const form2 = new FormData();
    form2.append('image', new Blob([PNG_1X1], { type: 'image/png' }), 'after-restart.png');
    const uploadedAfterRestart = await api('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form2,
    });
    assert(
      uploadedAfterRestart.status === 200 && uploadedAfterRestart.body?.url?.startsWith('/uploads/'),
      `upload after restart failed: ${JSON.stringify(uploadedAfterRestart)}`,
    );

    const chunkBytes = Buffer.alloc(600 * 1024, 7);
    const chunkFormName = 'big-photo.jpg';
    const CHUNK_SIZE = 512 * 1024;
    const totalChunks = Math.ceil(chunkBytes.length / CHUNK_SIZE);
    const uploadId = 'testchunkid123';
    let chunkUrl = '';
    for (let i = 0; i < totalChunks; i++) {
      const slice = chunkBytes.subarray(i * CHUNK_SIZE, Math.min((i + 1) * CHUNK_SIZE, chunkBytes.length));
      const chunkRes = await api('/api/upload/chunk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uploadId,
          chunkIndex: i,
          totalChunks,
          chunkData: slice.toString('base64'),
          filename: chunkFormName,
        }),
      });
      assert(chunkRes.status === 200, `chunk ${i} failed: ${JSON.stringify(chunkRes)}`);
      if (chunkRes.body?.url) chunkUrl = chunkRes.body.url;
    }
    assert(chunkUrl.startsWith('/uploads/') && chunkUrl.endsWith('.jpg'), `chunked upload missing url: ${chunkUrl}`);
    assert(fs.existsSync(path.join(uploadDir, chunkUrl.replace('/uploads/', ''))), 'chunked file missing on disk');

    console.log('upload auth tests passed');
  } finally {
    await stopServer(child);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
