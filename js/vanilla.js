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

  // Swaps the fixture for a clone of itself (same content, zero listeners) —
  // same trick as dom.js — so Run never stacks duplicate listeners.
  function stripListeners(el) {
    var clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
    return clone;
  }

  /* ============ live code-playground engine (same shape as dom.js) ============ */
  // Extended with a `hooks` object: student code can attach functions to it
  // (e.g. hooks.addItem = function () {...}), which lets an external control
  // that lives OUTSIDE the editable fixture (like a permanent "+ Add Item"
  // button) trigger whatever logic the CURRENTLY loaded code defines —
  // necessary because that logic is redeclared fresh on every Run.
  function initPlayground(cfg) {
    var fixtureEl = document.getElementById(cfg.fixtureId);
    var htmlEl = cfg.htmlId ? document.getElementById(cfg.htmlId) : null;
    var renderBtn = cfg.renderId ? document.getElementById(cfg.renderId) : null;
    var codeEl = document.getElementById(cfg.codeId);
    var runBtn = document.getElementById(cfg.runId);
    var resetBtn = cfg.resetId ? document.getElementById(cfg.resetId) : null;
    var outputEl = document.getElementById(cfg.outputId);
    if (!fixtureEl || !codeEl || !runBtn || !outputEl) return null;
    var originalHTML = fixtureEl.innerHTML;
    if (htmlEl) htmlEl.value = originalHTML.trim();
    var hooks = {};

    function push(text, cls) {
      var div = document.createElement('div');
      div.className = 'output-line ' + cls;
      div.textContent = text;
      outputEl.appendChild(div);
    }

    if (renderBtn) {
      renderBtn.addEventListener('click', function () {
        fixtureEl.innerHTML = htmlEl.value;
      });
    }

    function run() {
      outputEl.innerHTML = '';
      hooks = {};
      if (cfg.clearListenersBeforeRun) fixtureEl = stripListeners(fixtureEl);
      var fakeConsole = { log: function () { push(Array.prototype.map.call(arguments, fmt).join(' '), 'output-line--log'); } };
      try {
        var fn = new Function('console', 'hooks', codeEl.value);
        fn(fakeConsole, hooks);
      } catch (e) {
        push(e.name + ': ' + e.message, 'output-line--error');
      }
      if (cfg.afterRun) cfg.afterRun();
    }
    runBtn.addEventListener('click', run);

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        fixtureEl.innerHTML = originalHTML;
        if (htmlEl) htmlEl.value = originalHTML.trim();
        outputEl.innerHTML = '';
        hooks = {};
        if (cfg.afterReset) cfg.afterReset();
      });
    }
    run(); // auto-run once so previews aren't blank on load
    return { run: run, getHooks: function () { return hooks; } };
  }

  /* ============ Ch.1 — Fetching Real Data ============ */
  (function initFetch() {
    var codeEl = document.getElementById('vFetchCode');
    var loadSuccessBtn = document.getElementById('vFetchLoadSuccess');
    var loadErrorBtn = document.getElementById('vFetchLoadError');
    if (!codeEl) return;

    var SUCCESS = [
      'function fakeFetchProducts() {',
      '  return new Promise(function (resolve) {',
      '    setTimeout(function () {',
      '      resolve([',
      "        { id: 1, name: 'Notebook', price: 499 },",
      "        { id: 2, name: 'Pen', price: 99 },",
      "        { id: 3, name: 'Backpack', price: 1999 }",
      '      ]);',
      '    }, 1200);',
      '  });',
      '}',
      '',
      "var listEl = document.getElementById('vFetchList');",
      "listEl.textContent = 'Loading...';",
      '',
      'fakeFetchProducts()',
      '  .then(function (products) {',
      "    listEl.innerHTML = '';",
      '    products.forEach(function (p) {',
      "      var div = document.createElement('div');",
      "      div.className = 'pg-item';",
      "      div.textContent = p.name + ' — ₹' + p.price;",
      '      listEl.appendChild(div);',
      '    });',
      '  })',
      '  .catch(function (err) {',
      "    listEl.textContent = 'Error: ' + err.message;",
      '  });'
    ].join('\n');

    var ERROR = [
      'function fakeFetchProducts() {',
      '  return new Promise(function (resolve, reject) {',
      '    setTimeout(function () {',
      "      reject(new Error('Network request failed'));",
      '    }, 1200);',
      '  });',
      '}',
      '',
      "var listEl = document.getElementById('vFetchList');",
      "listEl.textContent = 'Loading...';",
      '',
      'fakeFetchProducts()',
      '  .then(function (products) {',
      "    listEl.innerHTML = '';",
      '    products.forEach(function (p) {',
      "      var div = document.createElement('div');",
      "      div.className = 'pg-item';",
      "      div.textContent = p.name + ' — ₹' + p.price;",
      '      listEl.appendChild(div);',
      '    });',
      '  })',
      '  .catch(function (err) {',
      "    listEl.textContent = 'Error: ' + err.message;",
      '  });'
    ].join('\n');

    var pg = initPlayground({
      fixtureId: 'vFetchFixture', htmlId: 'vFetchHtml', renderId: 'vFetchRender',
      codeId: 'vFetchCode', runId: 'vFetchRun', resetId: 'vFetchReset', outputId: 'vFetchOutput'
    });

    function load(text, activeBtn) {
      codeEl.value = text;
      [loadSuccessBtn, loadErrorBtn].forEach(function (b) { if (b) b.classList.remove('is-active'); });
      if (activeBtn) activeBtn.classList.add('is-active');
      if (pg) pg.run();
    }
    if (loadSuccessBtn) loadSuccessBtn.addEventListener('click', function () { load(SUCCESS, loadSuccessBtn); });
    if (loadErrorBtn) loadErrorBtn.addEventListener('click', function () { load(ERROR, loadErrorBtn); });
    load(SUCCESS, loadSuccessBtn);
  })();

  /* ============ Ch.2 — Filtering What You Already Have ============ */
  initPlayground({
    fixtureId: 'vFilterFixture', htmlId: 'vFilterHtml', renderId: 'vFilterRender',
    codeId: 'vFilterCode', runId: 'vFilterRun', resetId: 'vFilterReset', outputId: 'vFilterOutput'
  });
  // seed this chapter's starter code directly (no presets needed)
  (function seedFilterCode() {
    var codeEl = document.getElementById('vFilterCode');
    var runBtn = document.getElementById('vFilterRun');
    if (!codeEl || !runBtn) return;
    codeEl.value = [
      'var products = [',
      "  { id: 1, name: 'Notebook', price: 499 },",
      "  { id: 2, name: 'Pen', price: 99 },",
      "  { id: 3, name: 'Backpack', price: 1999 }",
      '];',
      '',
      "var input = document.getElementById('vFilterInput');",
      "var list = document.getElementById('vFilterList');",
      '',
      'function render(items) {',
      "  list.innerHTML = '';",
      '  items.forEach(function (p) {',
      "    var div = document.createElement('div');",
      "    div.className = 'pg-item';",
      "    div.textContent = p.name + ' — ₹' + p.price;",
      '    list.appendChild(div);',
      '  });',
      '}',
      '',
      "input.addEventListener('input', function () {",
      '  var query = input.value.toLowerCase();',
      '  var filtered = products.filter(function (p) {',
      '    return p.name.toLowerCase().indexOf(query) !== -1;',
      '  });',
      '  render(filtered);',
      '});',
      '',
      'render(products); // filtering data already in memory — no re-fetch'
    ].join('\n');
    runBtn.click();
  })();

  /* ============ Ch.3 — Event Delegation, For Real This Time ============ */
  (function initDelegateChapter() {
    var codeEl = document.getElementById('vDelegateCode');
    var addBtn = document.getElementById('vDelegateAdd');
    if (!codeEl) return;
    codeEl.value = [
      'var products = [',
      "  { id: 1, name: 'Notebook' },",
      "  { id: 2, name: 'Pen' },",
      "  { id: 3, name: 'Backpack' }",
      '];',
      '',
      "var container = document.getElementById('vDelegateList');",
      '',
      '// ONE listener, attached ONCE — works for every button below,',
      '// including ones that do not exist yet when this line runs',
      "container.addEventListener('click', function (e) {",
      "  if (e.target.matches('.pg-btn')) {",
      "    console.log('Added to cart:', e.target.dataset.name);",
      '  }',
      '});',
      '',
      'function renderProducts() {',
      "  container.innerHTML = '';",
      '  products.forEach(function (p) {',
      "    var row = document.createElement('div');",
      "    row.className = 'pg-row';",
      "    row.innerHTML = '<span>' + p.name + '</span>';",
      "    var btn = document.createElement('button');",
      "    btn.className = 'pg-btn';",
      "    btn.textContent = 'Add to Cart';",
      '    btn.dataset.name = p.name;',
      '    row.appendChild(btn);',
      '    container.appendChild(row);',
      '  });',
      '}',
      '',
      'hooks.addProduct = function () {',
      "  products.push({ id: Date.now(), name: 'New Product' });",
      '  renderProducts(); // the ONE listener above still catches its click',
      '};',
      '',
      'renderProducts();'
    ].join('\n');

    var pg = initPlayground({
      fixtureId: 'vDelegateFixture', htmlId: 'vDelegateHtml', renderId: 'vDelegateRender',
      codeId: 'vDelegateCode', runId: 'vDelegateRun', resetId: 'vDelegateReset',
      outputId: 'vDelegateOutput', clearListenersBeforeRun: true
    });
    if (addBtn && pg) {
      addBtn.addEventListener('click', function () {
        var hooks = pg.getHooks();
        if (hooks.addProduct) hooks.addProduct();
      });
    }
  })();

  /* ============ Ch.4 — Derived State ============ */
  (function initDerivedChapter() {
    var codeEl = document.getElementById('vDerivedCode');
    var addBtn = document.getElementById('vDerivedAdd');
    if (!codeEl) return;
    codeEl.value = [
      'var cart = [',
      "  { name: 'Notebook', priceCents: 49900 },",
      "  { name: 'Pen', priceCents: 9900 }",
      '];',
      '',
      "var listEl = document.getElementById('vDerivedList');",
      "var totalEl = document.getElementById('vDerivedTotal');",
      '',
      'function render() {',
      "  listEl.innerHTML = '';",
      '  cart.forEach(function (item) {',
      "    var div = document.createElement('div');",
      "    div.className = 'pg-item';",
      "    div.textContent = item.name + ' — ₹' + (item.priceCents / 100).toFixed(2);",
      '    listEl.appendChild(div);',
      '  });',
      '',
      '  // DERIVED: computed fresh every render — never stored on its own',
      '  var totalCents = cart.reduce(function (sum, item) { return sum + item.priceCents; }, 0);',
      "  totalEl.textContent = 'Total: ₹' + (totalCents / 100).toFixed(2);",
      '}',
      '',
      'hooks.addItem = function () {',
      "  cart.push({ name: 'Extra Item', priceCents: 15000 });",
      '  render();',
      '};',
      '',
      'render();'
    ].join('\n');

    var pg = initPlayground({
      fixtureId: 'vDerivedFixture', htmlId: 'vDerivedHtml', renderId: 'vDerivedRender',
      codeId: 'vDerivedCode', runId: 'vDerivedRun', resetId: 'vDerivedReset', outputId: 'vDerivedOutput'
    });
    if (addBtn && pg) {
      addBtn.addEventListener('click', function () {
        var hooks = pg.getHooks();
        if (hooks.addItem) hooks.addItem();
      });
    }
  })();

  /* ============ Ch.5 — The Sync Problem (closing) ============ */
  (function initSyncChapter() {
    var codeEl = document.getElementById('vSyncCode');
    var loadBrokenBtn = document.getElementById('vSyncLoadBroken');
    var loadCorrectBtn = document.getElementById('vSyncLoadCorrect');
    var addBtn = document.getElementById('vSyncAdd');
    if (!codeEl) return;

    var BROKEN = [
      "var cart = [{ name: 'Notebook' }];",
      '',
      "var listEl = document.getElementById('vSyncList');",
      "var badgeEl = document.getElementById('vSyncBadge');",
      '',
      'function renderCartOnly() {',
      "  listEl.innerHTML = '';",
      '  cart.forEach(function (item) {',
      "    var div = document.createElement('div');",
      "    div.className = 'pg-item';",
      '    div.textContent = item.name;',
      '    listEl.appendChild(div);',
      '  });',
      '  // forgot to update badgeEl here — an easy, invisible mistake',
      '}',
      '',
      'hooks.addItem = function () {',
      "  cart.push({ name: 'Extra Item' });",
      '  renderCartOnly(); // badge silently goes stale',
      '};',
      '',
      'renderCartOnly();',
      'badgeEl.textContent = cart.length; // only ever set once, at the start'
    ].join('\n');

    var CORRECT = [
      "var cart = [{ name: 'Notebook' }];",
      '',
      "var listEl = document.getElementById('vSyncList');",
      "var badgeEl = document.getElementById('vSyncBadge');",
      '',
      'function render() {',
      "  listEl.innerHTML = '';",
      '  cart.forEach(function (item) {',
      "    var div = document.createElement('div');",
      "    div.className = 'pg-item';",
      '    div.textContent = item.name;',
      '    listEl.appendChild(div);',
      '  });',
      '  badgeEl.textContent = cart.length; // updated every time, on purpose',
      '}',
      '',
      'hooks.addItem = function () {',
      "  cart.push({ name: 'Extra Item' });",
      '  render();',
      '};',
      '',
      'render();'
    ].join('\n');

    var pg = initPlayground({
      fixtureId: 'vSyncFixture', htmlId: 'vSyncHtml', renderId: 'vSyncRender',
      codeId: 'vSyncCode', runId: 'vSyncRun', resetId: 'vSyncReset', outputId: 'vSyncOutput'
    });

    function load(text, activeBtn) {
      codeEl.value = text;
      [loadBrokenBtn, loadCorrectBtn].forEach(function (b) { if (b) b.classList.remove('is-active'); });
      if (activeBtn) activeBtn.classList.add('is-active');
      if (pg) pg.run();
    }
    if (loadBrokenBtn) loadBrokenBtn.addEventListener('click', function () { load(BROKEN, loadBrokenBtn); });
    if (loadCorrectBtn) loadCorrectBtn.addEventListener('click', function () { load(CORRECT, loadCorrectBtn); });
    load(BROKEN, loadBrokenBtn);

    if (addBtn && pg) {
      addBtn.addEventListener('click', function () {
        var hooks = pg.getHooks();
        if (hooks.addItem) hooks.addItem();
      });
    }
  })();

})();
