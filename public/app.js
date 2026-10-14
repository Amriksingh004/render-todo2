const $ = (selector) => document.querySelector(selector);
let tasks = [];
let filter = 'all';
let busy = false;

async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(20000) });
  if (response.status === 204) return;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not save your change. Please try again.');
  return data;
}

function render() {
  const done = tasks.filter(task => task.completed).length;
  $('#count').textContent = `${tasks.length - done} to do`;
  $('#progress-label').textContent = tasks.length ? `${done} of ${tasks.length} complete. Every step counts.` : 'One small step is a good start.';
  const visible = tasks.filter(task => filter === 'all' || (filter === 'done' ? task.completed : !task.completed));
  $('#task-list').replaceChildren();
  for (const task of visible) {
    const row = document.createElement('li');
    row.classList.toggle('completed', task.completed);
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox'; checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => mutate(async () => {
      await api(`/api/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ completed: checkbox.checked }) });
    }));
    const title = document.createElement('span');
    title.textContent = task.title;
    label.append(checkbox, title);
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'delete'; remove.textContent = '×';
    remove.setAttribute('aria-label', `Delete ${task.title}`);
    remove.addEventListener('click', () => mutate(() => api(`/api/tasks/${task.id}`, { method: 'DELETE' })));
    row.append(label, remove); $('#task-list').append(row);
  }
  $('#empty').hidden = visible.length > 0;
  $('#empty h3').textContent = tasks.length ? (filter === 'done' ? 'Small wins are on their way.' : 'A little breathing room.') : 'A little room for possibility.';
  $('#empty p').textContent = tasks.length ? (filter === 'done' ? 'Complete a task to see it here.' : 'No tasks in this view. Enjoy the moment.') : 'Add your first task above. You’ve got this.';
}

function showError(error) {
  $('#error').textContent = error.name === 'TimeoutError' ? 'The server is taking a moment. Try Refresh list shortly.' : error.message;
  $('#error').hidden = false;
}

async function load() {
  tasks = await api('/api/tasks');
  $('#connection').textContent = 'Backend connected';
  $('#connection').classList.add('online');
  render();
}

async function mutate(action) {
  if (busy) return;
  busy = true; $('#error').hidden = true;
  document.querySelectorAll('button, input').forEach(el => el.disabled = true);
  try { await action(); await load(); }
  catch (error) { showError(error); render(); }
  finally { busy = false; document.querySelectorAll('button, input').forEach(el => el.disabled = false); }
}

$('#task-form').addEventListener('submit', event => {
  event.preventDefault();
  const title = $('#task-input').value.trim();
  if (!title) return;
  mutate(async () => {
    await api('/api/tasks', { method: 'POST', body: JSON.stringify({ title }) });
    $('#task-input').value = '';
  }).then(() => $('#task-input').focus());
});
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
  render();
}));
$('#refresh').addEventListener('click', () => mutate(async () => {}));
load().catch(error => {
  $('#connection').textContent = 'Connection unavailable';
  $('#count').textContent = 'Offline';
  showError(error);
});
