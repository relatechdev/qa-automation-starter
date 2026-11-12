// A small application to practise on: sign-in, a dashboard, a list with search, a form,
// and a JSON API. It keeps everything in memory and has no dependencies.
import { randomUUID } from 'node:crypto';
import http from 'node:http';

const PORT = Number(process.env.PORT ?? 3210);
const ACCOUNT = { email: 'demo@example.test', password: 'demo-password' };
const PRIORITIES = ['low', 'medium', 'high'];
const NAME_LIMIT = 60;

const sessions = new Set();
const items = new Map();

function addItem(name, priority) {
  const item = { id: randomUUID(), name, priority, createdAt: new Date().toISOString() };
  items.set(item.id, item);
  return item;
}

addItem('Welcome checklist', 'low');
addItem('Quarterly report', 'high');
addItem('Team offsite', 'medium');

function send(res, status, body, headers = {}) {
  const isJson = typeof body === 'object' && body !== null;
  res.writeHead(status, {
    'Content-Type': isJson ? 'application/json' : 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(isJson ? JSON.stringify(body) : (body ?? ''));
}

function sessionOf(req) {
  const match = /(?:^|;\s*)session=([^;]+)/.exec(req.headers.cookie ?? '');
  return match && sessions.has(match[1]) ? match[1] : null;
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 10_000) return null;
  }
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return null;
  }
}

function validateItem(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name) return { error: 'Name is required.' };
  if (name.length > NAME_LIMIT) return { error: `Name can have at most ${NAME_LIMIT} characters.` };
  if (!PRIORITIES.includes(body.priority))
    return { error: 'Priority must be low, medium or high.' };
  return { name, priority: body.priority };
}

async function api(req, res, url) {
  const route = `${req.method} ${url.pathname}`;

  if (route === 'POST /api/login') {
    const body = await readJson(req);
    if (body?.email !== ACCOUNT.email || body?.password !== ACCOUNT.password) {
      return send(res, 401, { error: 'Wrong email or password.' });
    }
    const session = randomUUID();
    sessions.add(session);
    return send(
      res,
      200,
      { email: ACCOUNT.email },
      {
        'Set-Cookie': `session=${session}; HttpOnly; Path=/; SameSite=Lax`,
      },
    );
  }

  const session = sessionOf(req);
  if (!session) return send(res, 401, { error: 'Sign in first.' });

  if (route === 'POST /api/logout') {
    sessions.delete(session);
    return send(res, 204, null, { 'Set-Cookie': 'session=; Path=/; Max-Age=0' });
  }

  if (route === 'GET /api/summary') {
    const all = [...items.values()];
    return send(res, 200, {
      total: all.length,
      highPriority: all.filter((item) => item.priority === 'high').length,
    });
  }

  if (route === 'GET /api/items') {
    const query = (url.searchParams.get('q') ?? '').trim().toLowerCase();
    const found = [...items.values()]
      .filter((item) => item.name.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));
    return send(res, 200, { items: found });
  }

  if (route === 'POST /api/items') {
    const valid = validateItem(await readJson(req));
    if (valid.error) return send(res, 400, { error: valid.error });
    return send(res, 201, addItem(valid.name, valid.priority));
  }

  const itemId = /^\/api\/items\/([^/]+)$/.exec(url.pathname)?.[1];
  if (req.method === 'DELETE' && itemId) {
    return items.delete(itemId) ? send(res, 204, null) : send(res, 404, { error: 'No such item.' });
  }

  return send(res, 404, { error: 'Not found.' });
}

const STYLE = `
  body { font: 16px/1.5 system-ui, sans-serif; margin: 0; color: #1c2430; background: #f5f6f8; }
  header { background: #1c2430; color: #fff; padding: 12px 24px; display: flex; gap: 24px; align-items: center; }
  header a { color: #fff; } header button { margin-left: auto; }
  main { max-width: 760px; margin: 24px auto; padding: 0 24px; }
  .tiles { display: flex; gap: 16px; } .tile { background: #fff; padding: 16px 24px; border-radius: 8px; flex: 1; }
  .tile strong { display: block; font-size: 32px; }
  table { width: 100%; border-collapse: collapse; background: #fff; } th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e3e6ea; }
  form { display: flex; gap: 12px; align-items: end; flex-wrap: wrap; margin: 16px 0; }
  label { display: grid; gap: 4px; font-size: 14px; } input, select, button { font: inherit; padding: 6px 10px; }
  [role=alert] { color: #a4161a; }
`;

function page(title, body, { nav = true } = {}) {
  const header = nav
    ? `<header>
        <nav aria-label="Main"><a href="/">Dashboard</a> · <a href="/items">Items</a></nav>
        <button type="button" id="sign-out">Sign out</button>
      </header>
      <script>
        document.querySelector('#sign-out').addEventListener('click', async () => {
          await fetch('/api/logout', { method: 'POST' });
          location.href = '/login';
        });
      </script>`
    : '';
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>${title} · Demo</title><style>${STYLE}</style></head>
  <body>${header}<main>${body}</main></body>
</html>`;
}

const LOGIN = page(
  'Sign in',
  `<h1>Sign in</h1>
  <form id="login">
    <label>Email <input name="email" type="email" autocomplete="username" required></label>
    <label>Password <input name="password" type="password" autocomplete="current-password" required></label>
    <button type="submit">Sign in</button>
  </form>
  <p role="alert" id="error" hidden></p>
  <script>
    const form = document.querySelector('#login');
    const error = document.querySelector('#error');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const body = JSON.stringify(Object.fromEntries(new FormData(form)));
      const response = await fetch('/api/login', { method: 'POST', body });
      if (response.ok) return (location.href = '/');
      error.textContent = (await response.json()).error;
      error.hidden = false;
    });
  </script>`,
  { nav: false },
);

const DASHBOARD = page(
  'Dashboard',
  `<h1>Dashboard</h1>
  <div class="tiles">
    <div class="tile">Items <strong data-testid="total-items">…</strong></div>
    <div class="tile">High priority <strong data-testid="high-priority-items">…</strong></div>
  </div>
  <script>
    fetch('/api/summary').then((response) => response.json()).then((summary) => {
      document.querySelector('[data-testid=total-items]').textContent = summary.total;
      document.querySelector('[data-testid=high-priority-items]').textContent = summary.highPriority;
    });
  </script>`,
);

const ITEMS = page(
  'Items',
  `<h1>Items</h1>
  <form id="new-item">
    <label>Name <input name="name" maxlength="80"></label>
    <label>Priority
      <select name="priority">
        <option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option>
      </select>
    </label>
    <button type="submit">Add item</button>
  </form>
  <p role="alert" id="error" hidden></p>
  <label>Search items <input type="search" id="search"></label>
  <table>
    <thead><tr><th>Name</th><th>Priority</th><th>Actions</th></tr></thead>
    <tbody id="rows"></tbody>
  </table>
  <p id="empty" hidden>No items match.</p>
  <script>
    const form = document.querySelector('#new-item');
    const error = document.querySelector('#error');
    const search = document.querySelector('#search');
    const rows = document.querySelector('#rows');
    const empty = document.querySelector('#empty');

    function cell(text) {
      const td = document.createElement('td');
      td.textContent = text;
      return td;
    }

    function row(item) {
      const tr = document.createElement('tr');
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Delete';
      remove.setAttribute('aria-label', 'Delete ' + item.name);
      remove.addEventListener('click', async () => {
        await fetch('/api/items/' + item.id, { method: 'DELETE' });
        await load();
      });
      const actions = document.createElement('td');
      actions.append(remove);
      tr.append(cell(item.name), cell(item.priority), actions);
      return tr;
    }

    async function load() {
      const response = await fetch('/api/items?q=' + encodeURIComponent(search.value));
      const { items } = await response.json();
      rows.replaceChildren(...items.map(row));
      empty.hidden = items.length > 0;
    }

    let pending;
    search.addEventListener('input', () => {
      clearTimeout(pending);
      pending = setTimeout(load, 200);
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const body = JSON.stringify(Object.fromEntries(new FormData(form)));
      const response = await fetch('/api/items', { method: 'POST', body });
      error.hidden = response.ok;
      if (!response.ok) return (error.textContent = (await response.json()).error);
      form.reset();
      await load();
    });

    load();
  </script>`,
);

const PAGES = { '/': DASHBOARD, '/items': ITEMS };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  try {
    if (url.pathname === '/health') return send(res, 200, { status: 'ok' });
    if (url.pathname === '/favicon.ico') return send(res, 204, null);
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (url.pathname === '/login') return send(res, 200, LOGIN);
    if (!(url.pathname in PAGES)) return send(res, 404, page('Not found', '<h1>Not found</h1>'));
    if (!sessionOf(req)) return send(res, 302, null, { Location: '/login' });
    return send(res, 200, PAGES[url.pathname]);
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: 'Something went wrong.' });
  }
});

server.listen(PORT, () => console.log(`Demo app on http://localhost:${PORT}`));
