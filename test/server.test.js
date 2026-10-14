import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';

test('frontend, health, task lifecycle, and validation', async (t) => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (route, method = 'GET', body) => fetch(base + route, {
    method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const page = await request('/');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Little List/);
  for (const asset of ['/styles.css', '/app.js']) assert.equal((await request(asset)).status, 200);
  assert.deepEqual(await (await request('/api/health')).json(), { status: 'ok' });
  assert.deepEqual(await (await request('/api/tasks')).json(), []);
  const created = await request('/api/tasks', 'POST', { title: '  Deploy my app  ' });
  assert.equal(created.status, 201);
  const task = await created.json();
  assert.equal(task.title, 'Deploy my app');
  assert.equal(task.completed, false);
  assert.equal((await (await request('/api/tasks')).json()).length, 1);
  const updated = await request(`/api/tasks/${task.id}`, 'PATCH', { completed: true });
  assert.equal((await updated.json()).completed, true);
  assert.equal((await request(`/api/tasks/${task.id}`, 'PATCH', { completed: 'yes' })).status, 400);
  for (const body of [{ title: ' ' }, { title: 'x'.repeat(121) }, null, {}]) {
    assert.equal((await request('/api/tasks', 'POST', body)).status, 400);
  }
  assert.equal((await fetch(base + '/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
  assert.equal((await request(`/api/tasks/${task.id}`, 'DELETE')).status, 204);
  assert.deepEqual(await (await request('/api/tasks')).json(), []);
  assert.equal((await request(`/api/tasks/${task.id}`, 'DELETE')).status, 404);
  assert.equal((await request('/server.js')).status, 404);
  assert.equal((await request('/package.json')).status, 404);
});
