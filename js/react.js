(function () {
  'use strict';

  /* ============ initial scroll position ============ */
  window.scrollTo(0, 0);
  if (window.history.replaceState) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  /* ============ sidebar toggle (mobile) ============ */
  var sidebar = document.getElementById('sidebar');
  var navToggle = document.getElementById('navToggle');
  navToggle.addEventListener('click', function () {
    sidebar.classList.toggle('open');
  });
  document.querySelectorAll('.nav-list a').forEach(function (a) {
    a.addEventListener('click', function () { sidebar.classList.remove('open'); });
  });

  /* ============ sidebar collapse (desktop, hover-to-expand) ============ */
  var collapseToggle = document.getElementById('sidebarCollapseToggle');
  var SIDEBAR_COLLAPSE_KEY = 'jsfund-sidebar-collapsed';
  function setSidebarCollapsed(collapsed) {
    sidebar.classList.toggle('collapsed', collapsed);
    sidebar.classList.remove('hover-preview');
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    collapseToggle.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    collapseToggle.setAttribute('title', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    try { localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? '1' : '0'); } catch (e) { /* ignore */ }
  }
  var SIDEBAR_DESKTOP_MIN_WIDTH = 900;
  function syncCollapseToggleVisibility() {
    if (!collapseToggle) return;
    collapseToggle.style.display = window.innerWidth <= SIDEBAR_DESKTOP_MIN_WIDTH ? 'none' : '';
  }
  if (collapseToggle) {
    syncCollapseToggleVisibility();
    window.addEventListener('resize', syncCollapseToggleVisibility);
    collapseToggle.addEventListener('click', function () {
      setSidebarCollapsed(!sidebar.classList.contains('collapsed'));
    });
    sidebar.addEventListener('mouseenter', function () { sidebar.classList.add('hover-preview'); });
    sidebar.addEventListener('mouseleave', function () { sidebar.classList.remove('hover-preview'); });
    var storedCollapsed = null;
    try { storedCollapsed = localStorage.getItem(SIDEBAR_COLLAPSE_KEY); } catch (e) { /* ignore */ }
    if (storedCollapsed === '1') setSidebarCollapsed(true);
  }

  /* ============ scroll-spy + progress bar ============ */
  var sections = Array.prototype.slice.call(document.querySelectorAll('.chapter'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-list a'));
  var progressBar = document.getElementById('progressBar');
  function onScroll() {
    var scrollPos = window.scrollY + window.innerHeight * 0.35;
    var current = sections[0] ? sections[0].id : null;
    sections.forEach(function (sec) { if (sec.offsetTop <= scrollPos) current = sec.id; });
    navLinks.forEach(function (a) { a.classList.toggle('active', a.dataset.section === current); });
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    progressBar.style.width = pct + '%';
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============ shared helpers ============ */
  function fmt(a) {
    if (typeof a === 'undefined') return 'undefined';
    if (a === null) return 'null';
    if (typeof a === 'object') { try { return JSON.stringify(a); } catch (e) { return String(a); } }
    return String(a);
  }

  /* ============ real React + Babel playground engine ============ */
  // Babel Standalone compiles the student's JSX to plain JS IN THE BROWSER
  // (no build step), then it runs against the REAL React/ReactDOM UMD
  // globals, mounted into a real, visible DOM node. This is genuine React
  // behavior — not a simulation — which matters for chapters like Lists &
  // Keys where the whole point is watching a real reconciliation bug happen.
  // Starter code lives as a JS string (cfg.starterCode) rather than as
  // literal textarea markup, so JSX's <angle brackets> and && never have to
  // fight HTML parsing/escaping rules.
  function initReactPlayground(cfg) {
    var mountEl = document.getElementById(cfg.mountId);
    var codeEl = document.getElementById(cfg.codeId);
    var runBtn = document.getElementById(cfg.runId);
    var outputEl = document.getElementById(cfg.outputId);
    var resetBtn = cfg.resetId ? document.getElementById(cfg.resetId) : null;
    var compiledEl = cfg.compiledId ? document.getElementById(cfg.compiledId) : null;
    if (!mountEl || !codeEl || !runBtn || !outputEl) return null;
    if (typeof cfg.starterCode === 'string') codeEl.value = cfg.starterCode;
    var originalCode = codeEl.value;
    var root = null;

    function push(text, cls) {
      var div = document.createElement('div');
      div.className = 'output-line ' + cls;
      div.textContent = text;
      outputEl.appendChild(div);
    }

    function run() {
      outputEl.innerHTML = '';
      var fakeConsole = {
        log: function () { push(Array.prototype.map.call(arguments, fmt).join(' '), 'output-line--log'); },
        error: function () { push(Array.prototype.map.call(arguments, fmt).join(' '), 'output-line--error'); }
      };
      var compiled;
      try {
        compiled = Babel.transform(codeEl.value, { presets: ['react'] }).code;
      } catch (e) {
        push('Compile error: ' + e.message, 'output-line--error');
        return;
      }
      if (compiledEl) compiledEl.textContent = compiled;
      if (root) { try { root.unmount(); } catch (e) { /* ignore */ } }
      mountEl.innerHTML = '';
      root = ReactDOM.createRoot(mountEl);
      try {
        var fn = new Function('React', 'root', 'console', compiled);
        fn(React, root, fakeConsole);
      } catch (e) {
        push(e.name + ': ' + e.message, 'output-line--error');
      }
    }
    runBtn.addEventListener('click', run);

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        codeEl.value = originalCode;
        run();
      });
    }
    run(); // auto-render once on load so the preview isn't blank
    return { run: run };
  }

  /* ============ Ch.1 — Components: Functions That Return UI ============ */
  initReactPlayground({
    mountId: 'rComponentsMount', codeId: 'rComponentsCode', runId: 'rComponentsRun',
    resetId: 'rComponentsReset', outputId: 'rComponentsOutput',
    starterCode: [
      'function Greeting() {',
      '  return <h3>Hello from a component!</h3>;',
      '}',
      '',
      'function App() {',
      '  return (',
      '    <div>',
      '      <Greeting />',
      '    </div>',
      '  );',
      '}',
      '',
      'root.render(<App />);'
    ].join('\n')
  });

  /* ============ Ch.2 — JSX Is Just JavaScript ============ */
  initReactPlayground({
    mountId: 'rJsxMount', codeId: 'rJsxCode', runId: 'rJsxRun',
    resetId: 'rJsxReset', outputId: 'rJsxOutput', compiledId: 'rJsxCompiled',
    starterCode: [
      "const name = 'Ada';",
      '',
      'function Hello() {',
      '  return <h3>Hello, {name.toUpperCase()}! 2 + 2 = {2 + 2}</h3>;',
      '}',
      '',
      'root.render(<Hello />);'
    ].join('\n')
  });

  /* ============ Ch.3 — The Virtual DOM ============ */
  initReactPlayground({
    mountId: 'rVdomMount', codeId: 'rVdomCode', runId: 'rVdomRun',
    resetId: 'rVdomReset', outputId: 'rVdomOutput',
    starterCode: [
      "const { useState } = React;",
      '',
      'function Counter() {',
      '  const [count, setCount] = useState(0);',
      '  return (',
      '    <button onClick={() => setCount(count + 1)}>',
      '      Count: {count}',
      '    </button>',
      '  );',
      '}',
      '',
      'root.render(<Counter />);'
    ].join('\n')
  });

  /* ============ Ch.4 — Props ============ */
  initReactPlayground({
    mountId: 'rPropsMount', codeId: 'rPropsCode', runId: 'rPropsRun',
    resetId: 'rPropsReset', outputId: 'rPropsOutput',
    starterCode: [
      'function Greeting(props) {',
      '  return <h3>Hello, {props.name}!</h3>;',
      '}',
      '',
      'function App() {',
      '  return (',
      '    <div>',
      '      <Greeting name="Ada" />',
      '      <Greeting name="Grace" />',
      '    </div>',
      '  );',
      '}',
      '',
      'root.render(<App />);'
    ].join('\n')
  });

  /* ============ Ch.5 — Hooks: useState & useEffect ============ */
  initReactPlayground({
    mountId: 'rHooksMount', codeId: 'rHooksCode', runId: 'rHooksRun',
    resetId: 'rHooksReset', outputId: 'rHooksOutput',
    starterCode: [
      'const { useState, useEffect } = React;',
      '',
      'function Counter() {',
      '  const [count, setCount] = useState(0);',
      '',
      '  useEffect(() => {',
      "    console.log('Rendered! count is now', count);",
      '  }, [count]);',
      '',
      '  return (',
      '    <button onClick={() => setCount(count + 1)}>',
      '      Clicked {count} times',
      '    </button>',
      '  );',
      '}',
      '',
      'root.render(<Counter />);'
    ].join('\n')
  });

  /* ============ Ch.6 — Working With State Correctly ============ */
  (function initStateRules() {
    var codeEl = document.getElementById('rRulesCode');
    var loadBrokenBtn = document.getElementById('rRulesLoadBroken');
    var loadCorrectBtn = document.getElementById('rRulesLoadCorrect');
    if (!codeEl) return;

    var BROKEN = [
      'const { useState } = React;',
      '',
      'function TodoList() {',
      "  const [items, setItems] = useState(['Buy milk', 'Walk dog']);",
      '',
      '  function addItem() {',
      "    items.push('New task');  // mutates the SAME array in place",
      '    setItems(items);         // same reference — React sees no change',
      '  }',
      '',
      '  return (',
      '    <div>',
      '      <button onClick={addItem}>Add item (broken)</button>',
      '      <p>{items.length} items</p>',
      '      <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>',
      '    </div>',
      '  );',
      '}',
      'root.render(<TodoList />);'
    ].join('\n');

    var CORRECT = [
      'const { useState } = React;',
      '',
      'function TodoList() {',
      "  const [items, setItems] = useState(['Buy milk', 'Walk dog']);",
      '',
      '  function addItem() {',
      "    setItems([...items, 'New task']);  // a NEW array — React re-renders",
      '  }',
      '',
      '  return (',
      '    <div>',
      '      <button onClick={addItem}>Add item (correct)</button>',
      '      <p>{items.length} items</p>',
      '      <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>',
      '    </div>',
      '  );',
      '}',
      'root.render(<TodoList />);'
    ].join('\n');

    var pg = initReactPlayground({
      mountId: 'rRulesMount', codeId: 'rRulesCode', runId: 'rRulesRun',
      resetId: 'rRulesReset', outputId: 'rRulesOutput', starterCode: BROKEN
    });

    function load(text, activeBtn) {
      codeEl.value = text;
      [loadBrokenBtn, loadCorrectBtn].forEach(function (b) { if (b) b.classList.remove('is-active'); });
      if (activeBtn) activeBtn.classList.add('is-active');
      if (pg) pg.run();
    }
    if (loadBrokenBtn) loadBrokenBtn.addEventListener('click', function () { load(BROKEN, loadBrokenBtn); });
    if (loadCorrectBtn) loadCorrectBtn.addEventListener('click', function () { load(CORRECT, loadCorrectBtn); });
    if (loadBrokenBtn) loadBrokenBtn.classList.add('is-active'); // starts on the broken example
  })();

  /* ============ Ch.7 — Reacting to the User ============ */
  initReactPlayground({
    mountId: 'rEventsMount', codeId: 'rEventsCode', runId: 'rEventsRun',
    resetId: 'rEventsReset', outputId: 'rEventsOutput',
    starterCode: [
      "const { useState } = React;",
      '',
      'function NameForm() {',
      "  const [name, setName] = useState('');",
      '',
      '  return (',
      '    <div>',
      '      <input',
      '        value={name}',
      '        onChange={(e) => setName(e.target.value)}',
      '        placeholder="Type your name..."',
      '      />',
      '      {name.length > 0 && <p>Hello, {name}!</p>}',
      '      {name.length > 3 ? <p>Nice long name!</p> : <p>Keep typing...</p>}',
      '    </div>',
      '  );',
      '}',
      '',
      'root.render(<NameForm />);'
    ].join('\n')
  });

  /* ============ Ch.8 — Fetching Data ============ */
  initReactPlayground({
    mountId: 'rFetchMount', codeId: 'rFetchCode', runId: 'rFetchRun',
    resetId: 'rFetchReset', outputId: 'rFetchOutput',
    starterCode: [
      'const { useState, useEffect } = React;',
      '',
      'function fakeFetchUser(id) {',
      '  return new Promise((resolve, reject) => {',
      '    setTimeout(() => {',
      "      if (id === 0) reject(new Error('User not found'));",
      "      else resolve({ id: id, name: 'User ' + id });",
      '    }, 1200);',
      '  });',
      '}',
      '',
      'function Profile({ userId }) {',
      "  const [status, setStatus] = useState('loading');",
      '  const [user, setUser] = useState(null);',
      '  const [error, setError] = useState(null);',
      '',
      '  useEffect(() => {',
      "    setStatus('loading');",
      '    fakeFetchUser(userId)',
      "      .then((data) => { setUser(data); setStatus('success'); })",
      "      .catch((err) => { setError(err.message); setStatus('error'); });",
      '  }, [userId]);',
      '',
      "  if (status === 'loading') return <p>Loading...</p>;",
      "  if (status === 'error') return <p>Error: {error}</p>;",
      '  return <p>Loaded: {user.name}</p>;',
      '}',
      '',
      '// try userId={0} to see the error state',
      'root.render(<Profile userId={1} />);'
    ].join('\n')
  });

  /* ============ Ch.9 — Lists, Keys & Reconciliation ============ */
  initReactPlayground({
    mountId: 'rListsMount', codeId: 'rListsCode', runId: 'rListsRun',
    resetId: 'rListsReset', outputId: 'rListsOutput',
    starterCode: [
      'const { useState } = React;',
      '',
      'const initialItems = [',
      "  { id: 1, label: 'Apple' },",
      "  { id: 2, label: 'Banana' },",
      "  { id: 3, label: 'Cherry' }",
      '];',
      '',
      'function List() {',
      '  const [items, setItems] = useState(initialItems);',
      '',
      '  return (',
      '    <div>',
      '      <button onClick={() => setItems(items.slice(1))}>Remove first item</button>',
      '      <p>Type something into an input below, then click the button:</p>',
      '      <ul>',
      '        {items.map((item, index) => (',
      '          <li key={index}>',
      '            {item.label}: <input defaultValue="" placeholder="type here" />',
      '          </li>',
      '        ))}',
      '      </ul>',
      '    </div>',
      '  );',
      '}',
      '',
      '// try changing key={index} to key={item.id} — the bug disappears',
      'root.render(<List />);'
    ].join('\n')
  });

  /* ============ Ch.10 — Lifting State Up ============ */
  initReactPlayground({
    mountId: 'rLiftMount', codeId: 'rLiftCode', runId: 'rLiftRun',
    resetId: 'rLiftReset', outputId: 'rLiftOutput',
    starterCode: [
      'const { useState } = React;',
      '',
      'function TemperatureInput({ label, value, onChange }) {',
      '  return (',
      '    <label>',
      '      {label}: <input value={value} onChange={(e) => onChange(e.target.value)} />',
      '    </label>',
      '  );',
      '}',
      '',
      'function App() {',
      "  const [celsius, setCelsius] = useState('20');",
      '',
      '  return (',
      '    <div>',
      '      <TemperatureInput label="Celsius" value={celsius} onChange={setCelsius} />',
      '      <p>In Fahrenheit: {(celsius * 9 / 5 + 32).toFixed(1)}°F</p>',
      '    </div>',
      '  );',
      '}',
      '',
      'root.render(<App />);'
    ].join('\n')
  });

  /* ============ Ch.11 — Structuring a Real App ============ */
  initReactPlayground({
    mountId: 'rCompositionMount', codeId: 'rCompositionCode', runId: 'rCompositionRun',
    resetId: 'rCompositionReset', outputId: 'rCompositionOutput',
    starterCode: [
      'function Header() {',
      '  return <h3>My Todo App</h3>;',
      '}',
      '',
      'function TodoItem({ text }) {',
      '  return <li>{text}</li>;',
      '}',
      '',
      'function TodoList({ items }) {',
      '  return <ul>{items.map((t, i) => <TodoItem key={i} text={t} />)}</ul>;',
      '}',
      '',
      'function Footer({ count }) {',
      '  return <p>{count} items total</p>;',
      '}',
      '',
      'function App() {',
      "  const items = ['Learn components', 'Learn hooks', 'Build something real'];",
      '  return (',
      '    <div>',
      '      <Header />',
      '      <TodoList items={items} />',
      '      <Footer count={items.length} />',
      '    </div>',
      '  );',
      '}',
      '',
      'root.render(<App />);'
    ].join('\n')
  });

})();
