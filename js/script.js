(function () {
  'use strict';

  /* ============ sidebar toggle (mobile) ============ */
  var sidebar = document.getElementById('sidebar');
  var navToggle = document.getElementById('navToggle');
  navToggle.addEventListener('click', function () {
    sidebar.classList.toggle('open');
  });
  document.querySelectorAll('.nav-list a').forEach(function (a) {
    a.addEventListener('click', function () { sidebar.classList.remove('open'); });
  });

  /* ============ sidebar collapse (desktop, hover-to-expand like ChatGPT/Claude) ============ */
  var collapseToggle = document.getElementById('sidebarCollapseToggle');
  var SIDEBAR_COLLAPSE_KEY = 'jsfund-sidebar-collapsed';
  function setSidebarCollapsed(collapsed) {
    sidebar.classList.toggle('collapsed', collapsed);
    sidebar.classList.remove('hover-preview'); // a fresh click always wins over any stale hover state
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    collapseToggle.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    collapseToggle.setAttribute('title', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    try { localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? '1' : '0'); } catch (e) { /* private mode etc — ignore */ }
  }
  if (collapseToggle) {
    collapseToggle.addEventListener('click', function () {
      setSidebarCollapsed(!sidebar.classList.contains('collapsed'));
    });
    // mouseenter/mouseleave (not CSS :hover) so the peek-on-hover only
    // triggers when the pointer newly crosses into the sidebar — not when
    // it's already resting there the instant the toggle button is clicked
    sidebar.addEventListener('mouseenter', function () {
      sidebar.classList.add('hover-preview');
    });
    sidebar.addEventListener('mouseleave', function () {
      sidebar.classList.remove('hover-preview');
    });
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
    sections.forEach(function (sec) {
      if (sec.offsetTop <= scrollPos) current = sec.id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle('active', a.dataset.section === current);
    });

    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    progressBar.style.width = pct + '%';
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============ "need for JS" live demo ============ */
  var liveBtn = document.getElementById('liveBtn');
  var liveNote = document.getElementById('liveNote');
  var clickCount = 0;
  if (liveBtn) {
    liveBtn.addEventListener('click', function () {
      clickCount++;
      liveNote.textContent = 'clicked ' + clickCount + ' time' + (clickCount === 1 ? '' : 's') + ' — that\'s JS!';
      liveBtn.style.transform = 'rotate(' + (clickCount % 2 === 0 ? '-3deg' : '3deg') + ')';
    });
  }

  /* ============ sandboxed code runner ============ */
  function runSnippet(code, outputEl) {
    outputEl.innerHTML = '';
    var lines = [];

    function push(text, cls) {
      var div = document.createElement('div');
      div.className = 'output-line ' + cls;
      div.textContent = text;
      outputEl.appendChild(div);
    }

    var iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    var win = iframe.contentWindow;

    var fmt = function (arg) {
      if (typeof arg === 'undefined') return 'undefined';
      if (arg === null) return 'null';
      if (typeof arg === 'object') {
        try { return JSON.stringify(arg); } catch (e) { return String(arg); }
      }
      return String(arg);
    };

    win.console = {
      log: function () {
        push(Array.prototype.map.call(arguments, fmt).join(' '), 'output-line--log');
      }
    };

    // support setTimeout so the event-loop example actually demonstrates ordering
    win.__queuedLogs = [];
    var realSetTimeout = window.setTimeout;
    win.setTimeout = function (fn, delay) {
      return realSetTimeout(function () {
        try { fn(); } catch (e) { push(e.name + ': ' + e.message, 'output-line--error'); }
      }, delay || 0);
    };

    try {
      win.eval(code);
    } catch (e) {
      push(e.name + ': ' + e.message, 'output-line--error');
    }

    realSetTimeout(function () {
      document.body.removeChild(iframe);
    }, 1500);

    if (!outputEl.children.length) {
      push('(no output)', 'output-line');
    }
  }

  document.querySelectorAll('.snippet').forEach(function (snippet) {
    var btn = snippet.querySelector('.run-btn');
    var codeEl = snippet.querySelector('.snippet-code');
    var outputEl = snippet.querySelector('.snippet-output');
    btn.addEventListener('click', function () {
      runSnippet(codeEl.textContent, outputEl);
    });
  });

  /* ============ call stack + scope mini-devtools ============ */
  var dtCodeLines = [
    'function multiply(a, b) {',
    '  let result = a * b;',
    '  return result;',
    '}',
    '',
    'function square(n) {',
    '  return multiply(n, n);',
    '}',
    '',
    'function printSquare(n) {',
    '  let sq = square(n);',
    '  console.log(sq);',
    '}',
    '',
    'printSquare(5);'
  ];

  var GLOBAL_FRAME = { name: 'Global', vars: [
    { name: 'multiply', value: 'ƒ multiply()' },
    { name: 'square', value: 'ƒ square()' },
    { name: 'printSquare', value: 'ƒ printSquare()' }
  ] };

  // Each step: which line is active, the full call stack (top = innermost,
  // last = Global), and a human note. Stack frames are listed innermost-first
  // to match how the Scope panel and Call Stack panel both read top-down.
  var dtSteps = [
    { line: 15, stack: [GLOBAL_FRAME], note: 'Global memory phase already hoisted multiply, square and printSquare. Now executing line 15: printSquare(5) is called.' },
    { line: 10, stack: [
        { name: 'printSquare(n=5)', vars: [{ name: 'n', value: '5' }, { name: 'sq', value: '<TDZ>', tdz: true, fresh: true }] },
        GLOBAL_FRAME
      ], note: 'printSquare\'s own memory phase runs first: param n = 5, and sq (declared with let) sits in the Temporal Dead Zone until its line runs.' },
    { line: 11, stack: [
        { name: 'printSquare(n=5)', vars: [{ name: 'n', value: '5' }, { name: 'sq', value: '<TDZ>', tdz: true }] },
        GLOBAL_FRAME
      ], note: 'Line 11 starts: sq = square(n) — about to call square(5).' },
    { line: 6, stack: [
        { name: 'square(n=5)', vars: [{ name: 'n', value: '5' }], fresh: true },
        { name: 'printSquare(n=5)', vars: [{ name: 'n', value: '5' }, { name: 'sq', value: '<TDZ>', tdz: true }] },
        GLOBAL_FRAME
      ], note: 'square(5) is pushed onto the call stack. Its own frame only knows about n = 5 so far.' },
    { line: 7, stack: [
        { name: 'square(n=5)', vars: [{ name: 'n', value: '5' }] },
        { name: 'printSquare(n=5)', vars: [{ name: 'n', value: '5' }, { name: 'sq', value: '<TDZ>', tdz: true }] },
        GLOBAL_FRAME
      ], note: 'Line 7: return multiply(n, n) — about to call multiply(5, 5).' },
    { line: 1, stack: [
        { name: 'multiply(a=5, b=5)', vars: [{ name: 'a', value: '5' }, { name: 'b', value: '5' }, { name: 'result', value: '<TDZ>', tdz: true }], fresh: true },
        { name: 'square(n=5)', vars: [{ name: 'n', value: '5' }] },
        { name: 'printSquare(n=5)', vars: [{ name: 'n', value: '5' }, { name: 'sq', value: '<TDZ>', tdz: true }] },
        GLOBAL_FRAME
      ], note: 'multiply(5, 5) is pushed — the deepest frame yet. result is still in its TDZ.' },
    { line: 2, stack: [
        { name: 'multiply(a=5, b=5)', vars: [{ name: 'a', value: '5' }, { name: 'b', value: '5' }, { name: 'result', value: '25', fresh: true }] },
        { name: 'square(n=5)', vars: [{ name: 'n', value: '5' }] },
        { name: 'printSquare(n=5)', vars: [{ name: 'n', value: '5' }, { name: 'sq', value: '<TDZ>', tdz: true }] },
        GLOBAL_FRAME
      ], note: 'Line 2 runs: result = a * b → result becomes 25.' },
    { line: 3, stack: [
        { name: 'square(n=5)', vars: [{ name: 'n', value: '5' }] },
        { name: 'printSquare(n=5)', vars: [{ name: 'n', value: '5' }, { name: 'sq', value: '<TDZ>', tdz: true }] },
        GLOBAL_FRAME
      ], note: 'multiply returns 25 and its frame is popped off the call stack — back inside square.' },
    { line: 7, stack: [
        { name: 'printSquare(n=5)', vars: [{ name: 'n', value: '5' }, { name: 'sq', value: '<TDZ>', tdz: true }] },
        GLOBAL_FRAME
      ], note: 'square returns 25 too and is popped — back inside printSquare, still on line 11.' },
    { line: 11, stack: [
        { name: 'printSquare(n=5)', vars: [{ name: 'n', value: '5' }, { name: 'sq', value: '25', fresh: true }] },
        GLOBAL_FRAME
      ], note: 'sq finally leaves the TDZ and is assigned 25.' },
    { line: 12, stack: [
        { name: 'printSquare(n=5)', vars: [{ name: 'n', value: '5' }, { name: 'sq', value: '25' }] },
        GLOBAL_FRAME
      ], note: 'console.log(sq) runs → logs 25.' },
    { line: 15, stack: [GLOBAL_FRAME], note: 'printSquare finishes and its frame is popped. The call stack is empty again — back to Global.' }
  ];

  var dtIndex = 0;
  var breakpoints = {};
  var dtCodeEl = document.getElementById('dtCode');
  var csStackEl = document.getElementById('csStack');
  var dtScopeEl = document.getElementById('dtScope');
  var csNote = document.getElementById('csNote');
  var csStepLabel = document.getElementById('csStepLabel');
  var csPrev = document.getElementById('csPrev');
  var csNext = document.getElementById('csNext');
  var csReset = document.getElementById('csReset');
  var csRun = document.getElementById('csRun');
  var dtRunTimer = null;

  // build the code panel once, with a clickable breakpoint gutter per line
  dtCodeLines.forEach(function (text, i) {
    var lineNo = i + 1;
    var row = document.createElement('div');
    row.className = 'dt-line';
    row.dataset.line = String(lineNo);

    var gutter = document.createElement('span');
    gutter.className = 'dt-gutter';
    var dot = document.createElement('span');
    dot.className = 'dt-gutter-dot';
    gutter.appendChild(dot);

    var num = document.createElement('span');
    num.className = 'dt-linenum';
    num.textContent = String(lineNo);

    var codeText = document.createElement('span');
    codeText.className = 'dt-linetext';
    codeText.textContent = text || ' ';

    row.appendChild(gutter);
    row.appendChild(num);
    row.appendChild(codeText);
    row.addEventListener('click', function () {
      if (breakpoints[lineNo]) delete breakpoints[lineNo];
      else breakpoints[lineNo] = true;
      row.classList.toggle('has-bp', !!breakpoints[lineNo]);
    });
    dtCodeEl.appendChild(row);
  });

  function renderDt() {
    var step = dtSteps[dtIndex];

    dtCodeEl.querySelectorAll('.dt-line').forEach(function (row) {
      row.classList.toggle('is-current', Number(row.dataset.line) === step.line);
    });
    var currentRow = dtCodeEl.querySelector('.dt-line.is-current');
    if (currentRow) currentRow.scrollIntoView({ block: 'nearest' });

    csStackEl.innerHTML = '';
    if (!step.stack.length) {
      csStackEl.innerHTML = '<div class="dt-empty">(empty)</div>';
    } else {
      step.stack.forEach(function (frame) {
        var div = document.createElement('div');
        div.className = 'cs-frame';
        div.textContent = frame.name;
        csStackEl.appendChild(div);
      });
    }

    dtScopeEl.innerHTML = '';
    step.stack.forEach(function (frame) {
      var block = document.createElement('div');
      block.className = 'dt-scope-frame';
      var label = document.createElement('div');
      label.className = 'dt-scope-frame-name';
      label.textContent = frame.name;
      block.appendChild(label);
      if (!frame.vars.length) {
        var empty = document.createElement('div');
        empty.className = 'dt-empty';
        empty.textContent = '(no locals)';
        block.appendChild(empty);
      } else {
        frame.vars.forEach(function (v) {
          var row = document.createElement('div');
          row.className = 'dt-var-row' + (v.tdz ? ' is-tdz' : '') + (v.fresh ? ' is-fresh' : '');
          var n = document.createElement('span');
          n.className = 'dt-var-name';
          n.textContent = v.name;
          var val = document.createElement('span');
          val.className = 'dt-var-val';
          val.textContent = v.value;
          row.appendChild(n);
          row.appendChild(val);
          block.appendChild(row);
        });
      }
      dtScopeEl.appendChild(block);
    });

    csNote.textContent = step.note;
    csStepLabel.textContent = 'Step ' + dtIndex + ' / ' + (dtSteps.length - 1);
    csPrev.disabled = dtIndex === 0;
    csNext.disabled = dtIndex === dtSteps.length - 1;
  }

  function stopRun() {
    if (dtRunTimer) { clearTimeout(dtRunTimer); dtRunTimer = null; }
    csRun.textContent = 'Run ▶ (to next breakpoint)';
  }

  csPrev.addEventListener('click', function () {
    stopRun();
    if (dtIndex > 0) { dtIndex--; renderDt(); }
  });
  csNext.addEventListener('click', function () {
    stopRun();
    if (dtIndex < dtSteps.length - 1) { dtIndex++; renderDt(); }
  });
  csReset.addEventListener('click', function () {
    stopRun();
    dtIndex = 0;
    renderDt();
  });
  var DT_RUN_STEP_MS = 6500; // slow, narrated pace — gives time to explain each step live
  csRun.addEventListener('click', function () {
    if (dtRunTimer) { stopRun(); return; }
    if (dtIndex >= dtSteps.length - 1) { dtIndex = 0; renderDt(); }
    csRun.textContent = '■ Pause (playing…)';
    var tick = function () {
      if (dtIndex >= dtSteps.length - 1) { stopRun(); return; }
      dtIndex++;
      renderDt();
      if (dtIndex >= dtSteps.length - 1 || breakpoints[dtSteps[dtIndex].line]) { stopRun(); return; }
      dtRunTimer = setTimeout(tick, DT_RUN_STEP_MS);
    };
    dtRunTimer = setTimeout(tick, DT_RUN_STEP_MS);
  });

  renderDt();

  /* ============ event loop stepper (with microtask queue) ============ */
  var TIMEOUT_CB = '() => console.log("Timeout callback")';
  var PROMISE_CB = '() => console.log("Promise callback")';
  var elCodeLines = [
    'console.log("Start");',
    '',
    'setTimeout(function () {',
    '  console.log("Timeout callback");',
    '}, 0);',
    '',
    'Promise.resolve().then(function () {',
    '  console.log("Promise callback");',
    '});',
    '',
    'console.log("End");'
  ];
  var elSteps = [
    { line: null, stack: [], webapi: [], micro: [], queue: [],
      note: 'Ready. We\'ll trace console.log("Start"); a setTimeout(...,0); a Promise.resolve().then(...); and console.log("End").' },
    { line: 1, stack: ['console.log("Start")'], webapi: [], micro: [], queue: [],
      note: '"Start" is logged immediately — pushed and popped from the call stack.' },
    { line: 3, stack: ['setTimeout(...)'], webapi: [], micro: [], queue: [],
      note: 'setTimeout is called — it hands its callback to the Web APIs to wait out a 0ms timer.' },
    { line: 3, stack: [], webapi: [TIMEOUT_CB + ' (0ms timer)'], micro: [], queue: [],
      note: 'The timeout callback now sits in Web APIs, counting down — even 0ms still yields to the rest of the script first.' },
    { line: 7, stack: ['Promise.resolve().then(...)'], webapi: [TIMEOUT_CB + ' (0ms timer)'], micro: [], queue: [],
      note: '.then() is called on an already-resolved promise — no Web API round-trip needed here.' },
    { line: 7, stack: [], webapi: [TIMEOUT_CB + ' (0ms timer)'], micro: [PROMISE_CB], queue: [],
      note: 'The promise callback goes straight into the Microtask Queue, a separate, higher-priority lane from the Callback Queue.' },
    { line: 11, stack: ['console.log("End")'], webapi: [TIMEOUT_CB + ' (0ms timer)'], micro: [PROMISE_CB], queue: [],
      note: '"End" logs next — the main script keeps running synchronously to its last line.' },
    { line: 11, stack: [], webapi: [TIMEOUT_CB + ' (0ms timer)'], micro: [PROMISE_CB], queue: [],
      note: 'Main script (the Global EC) finishes — the call stack is empty. The event loop now checks the Microtask Queue FIRST, before ever touching the Callback Queue.' },
    { line: 8, stack: [PROMISE_CB], webapi: [TIMEOUT_CB + ' (0ms timer)'], micro: [], queue: [],
      note: 'The promise callback is moved onto the stack and runs — logging "Promise callback".' },
    { line: 4, stack: [], webapi: [], micro: [], queue: [TIMEOUT_CB],
      note: 'Microtask Queue is now empty. Meanwhile the timer finished, so the timeout callback moves into the (macrotask) Callback Queue.' },
    { line: 4, stack: [TIMEOUT_CB], webapi: [], micro: [], queue: [],
      note: 'Only now — with the stack AND the microtask queue both empty — does the event loop pull from the Callback Queue.' },
    { line: 4, stack: [], webapi: [], micro: [], queue: [],
      note: '"Timeout callback" logs last. Final order: Start, End, Promise callback, Timeout callback — microtasks always drain before the next macrotask.' }
  ];
  var elIndex = 0;
  var elCodeEl = document.getElementById('elCode');
  var elStackEl = document.getElementById('elStack');
  var elWebApiEl = document.getElementById('elWebApi');
  var elMicrotaskEl = document.getElementById('elMicrotask');
  var elQueueEl = document.getElementById('elQueue');
  var elNote = document.getElementById('elNote');
  var elStepLabel = document.getElementById('elStepLabel');
  var elPrev = document.getElementById('elPrev');
  var elNext = document.getElementById('elNext');
  var elReset = document.getElementById('elReset');
  var elRun = document.getElementById('elRun');
  var elRunTimer = null;

  elCodeLines.forEach(function (text, i) {
    var lineNo = i + 1;
    var row = document.createElement('div');
    row.className = 'dt-line';
    row.dataset.line = String(lineNo);
    var gutter = document.createElement('span');
    gutter.className = 'dt-gutter';
    var num = document.createElement('span');
    num.className = 'dt-linenum';
    num.textContent = String(lineNo);
    var codeText = document.createElement('span');
    codeText.className = 'dt-linetext';
    codeText.textContent = text || ' ';
    row.appendChild(gutter);
    row.appendChild(num);
    row.appendChild(codeText);
    elCodeEl.appendChild(row);
  });

  function chip(text, cls) {
    var div = document.createElement('div');
    div.className = 'el-chip ' + (cls || '');
    div.textContent = text;
    return div;
  }
  function renderEl() {
    var step = elSteps[elIndex];

    elCodeEl.querySelectorAll('.dt-line').forEach(function (row) {
      row.classList.toggle('is-current', step.line !== null && Number(row.dataset.line) === step.line);
    });

    elStackEl.innerHTML = '';
    elWebApiEl.innerHTML = '';
    elMicrotaskEl.innerHTML = '';
    elQueueEl.innerHTML = '';
    step.stack.forEach(function (t) { elStackEl.appendChild(chip(t)); });
    step.webapi.forEach(function (t) { elWebApiEl.appendChild(chip(t, 'el-chip--webapi')); });
    step.micro.forEach(function (t) { elMicrotaskEl.appendChild(chip(t, 'el-chip--microtask')); });
    step.queue.forEach(function (t) { elQueueEl.appendChild(chip(t, 'el-chip--queue')); });
    elNote.textContent = step.note;
    elStepLabel.textContent = 'Step ' + elIndex + ' / ' + (elSteps.length - 1);
    elPrev.disabled = elIndex === 0;
    elNext.disabled = elIndex === elSteps.length - 1;
  }
  function stopElRun() {
    if (elRunTimer) { clearTimeout(elRunTimer); elRunTimer = null; }
    elRun.textContent = 'Run ▶ (trace)';
  }
  elPrev.addEventListener('click', function () { stopElRun(); if (elIndex > 0) { elIndex--; renderEl(); } });
  elNext.addEventListener('click', function () { stopElRun(); if (elIndex < elSteps.length - 1) { elIndex++; renderEl(); } });
  elReset.addEventListener('click', function () { stopElRun(); elIndex = 0; renderEl(); });
  var EL_RUN_STEP_MS = 3200;
  elRun.addEventListener('click', function () {
    if (elRunTimer) { stopElRun(); return; }
    if (elIndex >= elSteps.length - 1) { elIndex = 0; renderEl(); }
    elRun.textContent = '■ Pause (playing…)';
    var tick = function () {
      if (elIndex >= elSteps.length - 1) { stopElRun(); return; }
      elIndex++;
      renderEl();
      if (elIndex >= elSteps.length - 1) { stopElRun(); return; }
      elRunTimer = setTimeout(tick, EL_RUN_STEP_MS);
    };
    elRunTimer = setTimeout(tick, EL_RUN_STEP_MS);
  });
  renderEl();

  var elCodeRunBtn = document.getElementById('elCodeRun');
  var elCodeOutput = document.getElementById('elCodeOutput');
  if (elCodeRunBtn) {
    elCodeRunBtn.addEventListener('click', function () {
      runSnippet(elCodeLines.join('\n'), elCodeOutput);
    });
  }

})();
