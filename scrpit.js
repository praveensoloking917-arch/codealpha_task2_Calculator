  // ── State ──────────────────────────────────────────────────────────────────
  let current   = '0';   // what's shown
  let previous  = '';    // left operand (string)
  let operator  = null;  // +, −, ×, ÷
  let waiting   = false; // next digit replaces display

  const displayEl  = document.getElementById('display');
  const currentEl  = document.getElementById('current');
  const historyEl  = document.getElementById('history');

  // ── Helpers ────────────────────────────────────────────────────────────────
  function setDisplay(val) {
    current = String(val);
    currentEl.textContent = current;
    // scale text for long numbers
    const len = current.replace('-','').replace('.','').length;
    currentEl.className = 'current' + (len > 12 ? ' xsmall' : len > 9 ? ' small' : '');
  }

  function flashDisplay() {
    displayEl.classList.remove('flash-anim');
    void displayEl.offsetWidth; // reflow
    displayEl.classList.add('flash-anim');
  }

  function parseNum(s) { return parseFloat(s.replace('−','-')) || 0; }

  function fmt(n) {
    if (!isFinite(n)) return n > 0 ? 'Infinity' : 'Error';
    // avoid floating-point noise
    const s = parseFloat(n.toPrecision(12)).toString();
    return s;
  }

  function highlightOp(op) {
    document.querySelectorAll('.btn-op').forEach(b => {
      b.classList.toggle('active-op', b.dataset.op === op);
    });
  }

  // ── Core actions ───────────────────────────────────────────────────────────
  function inputDigit(d) {
    if (waiting) { setDisplay(d === '0' ? '0' : d); waiting = false; }
    else          { setDisplay(current === '0' ? d : current + d); }
  }

  function inputDecimal() {
    if (waiting) { setDisplay('0.'); waiting = false; return; }
    if (!current.includes('.')) setDisplay(current + '.');
  }

  function inputOp(op) {
    if (operator && !waiting) calculate(false);
    previous = current;
    operator = op;
    waiting  = true;
    historyEl.textContent = previous + ' ' + op;
    highlightOp(op);
  }

  function calculate(final = true) {
    if (!operator || waiting) return;
    const a = parseNum(previous);
    const b = parseNum(current);
    let result;
    switch (operator) {
      case '+': result = a + b; break;
      case '−': result = a - b; break;
      case '×': result = a * b; break;
      case '÷': result = b === 0 ? (a === 0 ? NaN : Infinity * Math.sign(a)) : a / b; break;
    }
    if (final) {
      historyEl.textContent = previous + ' ' + operator + ' ' + current + ' =';
      operator = null;
      waiting  = true;
      highlightOp(null);
      flashDisplay();
    }
    setDisplay(isNaN(result) ? 'Error' : fmt(result));
    if (!final) { previous = current; }
  }

  function clearAll() {
    current = '0'; previous = ''; operator = null; waiting = false;
    setDisplay('0');
    historyEl.textContent = '\u00a0';
    highlightOp(null);
  }

  function backspace() {
    if (waiting) return;
    const s = current.length > 1 ? current.slice(0, -1) : '0';
    setDisplay(s === '-' ? '0' : s);
  }

  function toggleSign() {
    if (current === '0' || current === 'Error') return;
    setDisplay(current.startsWith('-') ? current.slice(1) : '-' + current);
  }

  function percent() {
    const n = parseNum(current) / 100;
    setDisplay(fmt(n));
  }

  // ── Event routing ─────────────────────────────────────────────────────────
  document.querySelector('.calc-shell').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const { action, digit, op } = btn.dataset;
    switch (action) {
      case 'digit':   inputDigit(digit);  break;
      case 'decimal': inputDecimal();      break;
      case 'op':      inputOp(op);         break;
      case 'equals':  calculate(true);     break;
      case 'clear':   clearAll();          break;
      case 'sign':    toggleSign();        break;
      case 'percent': percent();           break;
    }
  });

  document.getElementById('backspace').addEventListener('click', backspace);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  const keyMap = {
    '0':'digit-0','1':'digit-1','2':'digit-2','3':'digit-3','4':'digit-4',
    '5':'digit-5','6':'digit-6','7':'digit-7','8':'digit-8','9':'digit-9',
    '.':'decimal',',':'decimal',
    '+':'op-+','-':'op-−','*':'op-×','/':'op-÷',
    'Enter':'equals','=':'equals',
    'Backspace':'backspace','Delete':'backspace',
    'Escape':'clear','c':'clear','C':'clear',
    '%':'percent',
  };

  document.addEventListener('keydown', e => {
    const mapped = keyMap[e.key];
    if (!mapped) return;
    e.preventDefault();
    const [type, val] = mapped.split('-');
    switch (type) {
      case 'digit':    inputDigit(val);  break;
      case 'decimal':  inputDecimal();   break;
      case 'op':       inputOp(val);     break;
      case 'equals':   calculate(true);  break;
      case 'backspace':backspace();      break;
      case 'clear':    clearAll();       break;
      case 'percent':  percent();        break;
    }
    // briefly highlight the matching button
    const match = document.querySelector(
      type === 'op'    ? `[data-op="${val}"]` :
      type === 'digit' ? `[data-digit="${val}"]` :
      type === 'equals'? `[data-action="equals"]` :
      type === 'clear' ? `[data-action="clear"]`  : null
    );
    if (match) {
      match.style.filter = 'brightness(1.5)';
      setTimeout(() => match.style.filter = '', 120);
    }
  });