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

  /* ============ Ch.1 — DOM tree, built live from whatever HTML is typed ============ */
  (function initTree() {
    var htmlEl = document.getElementById('treeHtmlCode');
    var renderBtn = document.getElementById('treeRender');
    var resetBtn = document.getElementById('treeReset');
    var containerEl = document.getElementById('domTree');
    if (!htmlEl || !containerEl) return;

    var STARTER = [
      '<html>',
      '  <head></head>',
      '  <body>',
      '    <h1>Hello</h1>',
      '    <ul>',
      '      <li>One</li>',
      '      <li>Two</li>',
      '    </ul>',
      '  </body>',
      '</html>'
    ].join('\n');
    htmlEl.value = STARTER;

    // recursively mirrors a real parsed element into the .tree-node /
    // .tree-row / .tree-branch structure the CSS already knows how to draw
    function renderInto(el, parent, isRoot) {
      var node = document.createElement('div');
      node.className = 'tree-node' + (isRoot ? ' tree-node--root' : '');
      var children = Array.prototype.slice.call(el.children);
      if (!children.length) node.classList.add('tree-node--leaf');
      node.textContent = el.tagName.toLowerCase();
      parent.appendChild(node);
      if (children.length) {
        var row = document.createElement('div');
        row.className = 'tree-row';
        children.forEach(function (child) {
          var branch = document.createElement('div');
          branch.className = 'tree-branch';
          row.appendChild(branch);
          renderInto(child, branch, false);
        });
        parent.appendChild(row);
      }
    }

    function build(html) {
      var temp = document.createElement('div');
      temp.innerHTML = html;
      var topLevel = Array.prototype.slice.call(temp.children);
      containerEl.innerHTML = '';
      if (!topLevel.length) return;
      if (topLevel.length === 1) {
        renderInto(topLevel[0], containerEl, true);
      } else {
        // no single root tag typed — wrap the siblings under a synthetic root
        var rootNode = document.createElement('div');
        rootNode.className = 'tree-node tree-node--root';
        rootNode.textContent = '(multiple roots)';
        containerEl.appendChild(rootNode);
        var row = document.createElement('div');
        row.className = 'tree-row';
        topLevel.forEach(function (child) {
          var branch = document.createElement('div');
          branch.className = 'tree-branch';
          row.appendChild(branch);
          renderInto(child, branch, false);
        });
        containerEl.appendChild(row);
      }
      var nodes = Array.prototype.slice.call(containerEl.querySelectorAll('.tree-node'));
      nodes.forEach(function (n, i) { setTimeout(function () { n.classList.add('is-in'); }, i * 130); });
    }

    build(STARTER);
    if (renderBtn) renderBtn.addEventListener('click', function () { build(htmlEl.value); });
    if (resetBtn) resetBtn.addEventListener('click', function () { htmlEl.value = STARTER; build(STARTER); });
  })();

  /* ============ shared: live code-playground engine (ch.2–6) ============ */
  // Executes the student's typed JS against the REAL page DOM via
  // new Function(...) — deliberately not an invisible sandboxed iframe like
  // the read-only snippets on the other pages, because the whole point here
  // is that document.querySelector etc. hits the visible fixture on screen.
  // The fixture's markup is ALSO directly editable (htmlId/renderId) —
  // typing HTML and pressing Render sets it as the fixture's real innerHTML.

  function withMatchHighlight(enabled, fn) {
    if (!enabled) { fn(); return; }
    var origQS = Document.prototype.querySelector;
    var origQSA = Document.prototype.querySelectorAll;
    function flash(el) {
      if (!el || !el.classList) return;
      el.classList.add('pg-match-flash');
      setTimeout(function () { el.classList.remove('pg-match-flash'); }, 900);
    }
    Document.prototype.querySelector = function () {
      var res = origQS.apply(this, arguments);
      if (res) flash(res);
      return res;
    };
    Document.prototype.querySelectorAll = function () {
      var res = origQSA.apply(this, arguments);
      Array.prototype.forEach.call(res, flash);
      return res;
    };
    // student code in these chapters runs synchronously, so it's safe to
    // restore the prototype methods immediately after the call returns
    try { fn(); } finally {
      Document.prototype.querySelector = origQS;
      Document.prototype.querySelectorAll = origQSA;
    }
  }

  // Swaps the fixture for a clone of itself (same content, zero listeners)
  // right before running code that attaches listeners — so hitting "Run"
  // twice in a row never stacks duplicate listeners. Unlike a full content
  // reset, this leaves any HTML the student typed & rendered untouched.
  function stripListeners(el) {
    var clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
    return clone;
  }

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
      if (cfg.clearListenersBeforeRun) fixtureEl = stripListeners(fixtureEl);
      var fakeConsole = { log: function () { push(Array.prototype.map.call(arguments, fmt).join(' '), 'output-line--log'); } };
      withMatchHighlight(!!cfg.matchHighlight, function () {
        try {
          var fn = new Function('console', codeEl.value);
          fn(fakeConsole);
        } catch (e) {
          push(e.name + ': ' + e.message, 'output-line--error');
        }
      });
      if (!outputEl.children.length) push('(no console output — check the preview above for visible changes)', 'output-line');
      if (cfg.afterRun) cfg.afterRun();
    }
    runBtn.addEventListener('click', run);

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        fixtureEl.innerHTML = originalHTML;
        if (htmlEl) htmlEl.value = originalHTML.trim();
        outputEl.innerHTML = '';
        if (cfg.afterReset) cfg.afterReset();
      });
    }
    return { run: run, getFixtureEl: function () { return fixtureEl; } };
  }

  /* ============ Ch.2 — Selecting ============ */
  initPlayground({
    fixtureId: 'pgSelectFixture', htmlId: 'pgSelectHtml', renderId: 'pgSelectRender',
    codeId: 'pgSelectCode', runId: 'pgSelectRun', resetId: 'pgSelectReset',
    outputId: 'pgSelectOutput', matchHighlight: true
  });

  /* ============ Ch.3 — Changing ============ */
  initPlayground({
    fixtureId: 'pgChangeCard', htmlId: 'pgChangeHtml', renderId: 'pgChangeRender',
    codeId: 'pgChangeCode', runId: 'pgChangeRun', resetId: 'pgChangeReset', outputId: 'pgChangeOutput'
  });

  /* ============ Ch.4 — Creating & inserting ============ */
  initPlayground({
    fixtureId: 'pgCreateFixture', htmlId: 'pgCreateHtml', renderId: 'pgCreateRender',
    codeId: 'pgCreateCode', runId: 'pgCreateRun', resetId: 'pgCreateReset', outputId: 'pgCreateOutput'
    // no clearListenersBeforeRun — running again really does append
    // another <li>, which is the point: append() keeps adding real nodes
  });

  /* ============ Ch.5 — Events ============ */
  initPlayground({
    fixtureId: 'pgEventsCard', htmlId: 'pgEventsHtml', renderId: 'pgEventsRender',
    codeId: 'pgEventsCode', runId: 'pgEventsRun', resetId: 'pgEventsReset',
    outputId: 'pgEventsOutput', clearListenersBeforeRun: true
    // click the real button/link in the fixture AFTER pressing Run
  });

  /* ============ Ch.6 — Event delegation (centerpiece) ============ */
  (function initDelegation() {
    var codeEl = document.getElementById('pgDelCode');
    var loadNoDelBtn = document.getElementById('pgDelLoadNo');
    var loadDelBtn = document.getElementById('pgDelLoadYes');
    var addBtn = document.getElementById('pgDelAdd');
    if (!codeEl) return;

    var NO_DELEGATION = [
      '// attaches a listener to EACH existing item individually',
      "document.querySelectorAll('#pgDelList li').forEach(function (li) {",
      "  li.addEventListener('click', function () {",
      "    console.log('Direct listener fired on:', li.textContent);",
      '  });',
      '});'
    ].join('\n');

    var WITH_DELEGATION = [
      '// ONE listener on the parent — also covers items added later',
      "document.getElementById('pgDelList').addEventListener('click', function (e) {",
      "  if (e.target.matches('li')) {",
      "    console.log('Delegated click — e.target is:', e.target.textContent);",
      '  }',
      '});'
    ].join('\n');

    function loadPreset(text, activeBtn) {
      codeEl.value = text;
      [loadNoDelBtn, loadDelBtn].forEach(function (b) { if (b) b.classList.remove('is-active'); });
      if (activeBtn) activeBtn.classList.add('is-active');
    }
    if (loadNoDelBtn) loadNoDelBtn.addEventListener('click', function () { loadPreset(NO_DELEGATION, loadNoDelBtn); });
    if (loadDelBtn) loadDelBtn.addEventListener('click', function () { loadPreset(WITH_DELEGATION, loadDelBtn); });
    loadPreset(NO_DELEGATION, loadNoDelBtn); // start on the "broken" example — that's the point being made

    var addCount = 0;
    var pg = initPlayground({
      fixtureId: 'pgDelFixture', htmlId: 'pgDelHtml', renderId: 'pgDelRender',
      codeId: 'pgDelCode', runId: 'pgDelRun', resetId: 'pgDelReset', outputId: 'pgDelOutput',
      clearListenersBeforeRun: true,
      afterRun: function () { addCount = 0; },
      afterReset: function () { addCount = 0; }
    });
    if (addBtn && pg) {
      addBtn.addEventListener('click', function () {
        // always look up the <ul> by its own stable id — it may have been
        // recreated inside a fresh clone of the fixture wrapper by now
        var list = document.getElementById('pgDelList');
        if (!list) return;
        addCount++;
        var li = document.createElement('li');
        li.textContent = 'New item ' + addCount;
        li.className = 'pg-item';
        list.appendChild(li);
      });
    }
  })();

})();
