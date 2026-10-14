import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const publicDir = fileURLToPath(new URL('./public/', import.meta.url));
const assets = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
};

function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}

async function readJSON(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) {
    throw Object.assign(new Error('Send JSON data.'), { status: 415 });
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 8192) throw Object.assign(new Error('Request is too large.'), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString()); }
  catch { throw Object.assign(new Error('Invalid JSON.'), { status: 400 }); }
}

// Memory storage keeps this starter easy to deploy. All visitors share this list.
// Add a database and authentication before using it for private or lasting data.
export function createServer() {
  const tasks = new Map();
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    try {
      const { pathname } = new URL(req.url, 'http://localhost');
      if (pathname === '/api/health' && req.method === 'GET') return json(res, 200, { status: 'ok' });
      if (pathname === '/api/tasks' && req.method === 'GET') return json(res, 200, [...tasks.values()]);
      if (pathname === '/api/tasks' && req.method === 'POST') {
        const body = await readJSON(req);
        const title = typeof body?.title === 'string' ? body.title.trim() : '';
        if (!title || title.length > 120) return json(res, 400, { error: 'Enter a task between 1 and 120 characters.' });
        if (tasks.size >= 200) return json(res, 400, { error: 'This demo holds 200 tasks. Delete a task first.' });
        const task = { id: randomUUID(), title, completed: false };
        tasks.set(task.id, task);
        return json(res, 201, task);
      }
      const match = pathname.match(/^\/api\/tasks\/([a-f0-9-]+)$/);
      if (match && ['PATCH', 'DELETE'].includes(req.method)) {
        const task = tasks.get(match[1]);
        if (!task) return json(res, 404, { error: 'Task not found. Refresh the page.' });
        if (req.method === 'DELETE') {
          tasks.delete(task.id);
          res.writeHead(204); return res.end();
        }
        const body = await readJSON(req);
        if (typeof body?.completed !== 'boolean') return json(res, 400, { error: 'completed must be true or false.' });
        task.completed = body.completed;
        return json(res, 200, task);
      }
      if (assets[pathname] && ['GET', 'HEAD'].includes(req.method)) {
        const [file, type] = assets[pathname];
        const content = await readFile(path.join(publicDir, file));
        res.writeHead(200, { 'Content-Type': type });
        return res.end(req.method === 'HEAD' ? undefined : content);
      }
      json(res, 404, { error: 'Not found.' });
    } catch (error) {
      if (!res.headersSent && !res.destroyed) json(res, error.status || 500, { error: error.status ? error.message : 'Something went wrong. Please try again.' });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  const server = createServer();
  server.listen(port, '0.0.0.0', () => console.log(`Little List is running at http://localhost:${port}`));
  process.on('SIGTERM', () => server.close(() => process.exit(0)));
}
