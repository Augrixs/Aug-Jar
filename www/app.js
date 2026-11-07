'use strict';
/* Daily Jar: a deposit / withdraw notebook. Data stays on this device (localStorage). Years are always CE. */

const KEY = 'aug-jar-v1';
const ROWS = 31; // rows per table
const MAX_AMOUNT = 999999999.99; // largest single amount
const MON = { en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], th: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'] };
const MONFULL = { en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], th: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'] };
const DAYFULL = { en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], th: ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'] };
const DAYSHORT = { en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], th: ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'] };
const TX = {
  title: ['Daily Jar', 'Daily Jar'],
  balance: ['Savings', 'เงินออมคงเหลือ'],
  deposited: ['Deposited', 'ฝากรวม'],
  book: ['Notebook', 'สมุด'],
  charts: ['Charts', 'กราฟ'],
  deposit: ['Deposit', 'ฝาก'],
  withdraw: ['Withdraw', 'ถอน'],
  saveDep: ['Save deposit', 'บันทึกการฝาก'],
  saveWd: ['Save withdrawal', 'บันทึกการถอน'],
  amount: ['Amount', 'จำนวนเงิน'],
  noteDep: ['Note: where did it come from?', 'โน้ต: ได้มาจากไหน'],
  noteWd: ['Note: what was it for?', 'โน้ต: เอาไปทำอะไร'],
  cancel: ['Cancel', 'ยกเลิก'],
  badAmount: ['Type an amount above 0 (up to 999,999,999)', 'ใส่จำนวนเงินมากกว่า 0 (ไม่เกิน 999,999,999)'],
  saved: ['Saved', 'บันทึกแล้ว'],
  del: ['Delete this entry', 'ลบรายการนี้'],
  delAsk: ['Delete this entry? The balance changes.', 'ลบรายการนี้ใช่ไหม ยอดคงเหลือจะเปลี่ยน'],
  deleted: ['Deleted', 'ลบแล้ว'],
  edit: ['Edit entry', 'แก้ไขรายการ'],
  date: ['Date', 'วันที่'],
  time: ['Time', 'เวลา'],
  type: ['Type', 'ประเภท'],
  note: ['Note', 'โน้ต'],
  bal: ['Balance', 'คงเหลือ'],
  amt: ['Amount', 'จำนวน'],
  menu: ['Menu', 'เมนู'],
  sound: ['Button sounds: on / off', 'เสียงปุ่ม: เปิด / ปิด'],
  language: ['Language', 'ภาษา'],
  currency: ['Change currency symbol', 'เปลี่ยนสัญลักษณ์เงิน'],
  currencyAsk: ['Currency symbol (for example ฿ or $)', 'สัญลักษณ์เงิน (เช่น ฿ หรือ $)'],
  csv: ['Export CSV', 'ส่งออก CSV'],
  backup: ['Back up (JSON file)', 'สำรองข้อมูล (ไฟล์ JSON)'],
  restore: ['Restore from backup', 'กู้คืนจากไฟล์สำรอง'],
  restored: ['Restored', 'กู้คืนแล้ว'],
  badFile: ['That file is not a backup', 'ไฟล์นี้ไม่ใช่ไฟล์สำรอง'],
  reset: ['Delete everything', 'ลบข้อมูลทั้งหมด'],
  resetAsk: ['Delete ALL entries on this device? This cannot be undone.', 'ลบรายการทั้งหมดในเครื่องนี้ใช่ไหม กู้คืนไม่ได้'],
  close: ['Close', 'ปิด'],
  table: ['Table', 'ตารางที่'],
  week: ['Week', 'สัปดาห์'],
  month: ['Month', 'เดือน'],
  year: ['Year', 'ปี'],
  deposits: ['Deposits', 'การฝาก'],
  withdrawals: ['Withdrawals', 'การถอน'],
  topDep: ['Most deposited', 'ฝากมากที่สุด'],
  topWd: ['Most withdrawn', 'ถอนมากที่สุด'],
  noData: ['No data for this period', 'ยังไม่มีข้อมูลในช่วงนี้'],
  other: ['Other', 'อื่นๆ'],
  total: ['Total', 'รวม'],
  prev: ['Previous', 'ก่อนหน้า'],
  next: ['Next', 'ถัดไป'],
  weekOf: ['Week', 'สัปดาห์'],
};

/* ---------- button sounds and a little bounce (Web Audio, no sound files) ---------- */
let actx = null;
function tone(type, f0, f1, at, len, vol) {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, at);
  o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), at + len);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + len);
  o.connect(g); g.connect(actx.destination);
  o.start(at); o.stop(at + len + 0.02);
}
function playSfx(kind) {
  if (db.sound === false) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const at = actx.currentTime + 0.005;
    if (kind === 'up') { tone('sine', 520, 780, at, 0.1, 0.22); tone('sine', 780, 1170, at + 0.07, 0.14, 0.2); }
    else if (kind === 'down') tone('triangle', 330, 150, at, 0.16, 0.25);
    else tone('sine', 640, 960, at, 0.07, 0.2);
  } catch { /* sound is optional */ }
}
document.addEventListener('pointerdown', (e) => {
  const el = e.target && e.target.closest ? e.target.closest('button') : null;
  if (!el || el.disabled) return;
  const c = el.classList;
  playSfx(c.contains('dep') && !c.contains('on') ? 'up' : c.contains('wd') && !c.contains('on') ? 'down' : c.contains('save') ? (c.contains('wd') ? 'down' : 'up') : c.contains('danger') ? 'down' : 'tap');
  c.remove('pop'); void el.offsetWidth; c.add('pop');
}, true);
document.addEventListener('animationend', (e) => { if (e.animationName === 'pop-bounce') e.target.classList.remove('pop'); });

let db = load();
let tab = 'book';
let tablePage = null; // null = last table
let mode = 'week';
let anchor = new Date();
const $app = document.getElementById('app');

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (d && Array.isArray(d.entries)) return { lang: d.lang === 'th' ? 'th' : 'en', cur: typeof d.cur === 'string' ? d.cur : '฿', sound: d.sound !== false, entries: d.entries.filter(okEntry) };
  } catch { /* fresh start */ }
  return { lang: 'en', cur: '฿', sound: true, entries: [] };
}
function okEntry(e) { return e && (e.type === 'dep' || e.type === 'wd') && Number.isFinite(e.amount) && e.amount > 0 && Number.isFinite(e.ts); }
function persist() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { toast('Storage is full or blocked'); } }
const t = (k) => TX[k][db.lang === 'th' ? 1 : 0];
const L = () => (db.lang === 'th' ? 'th' : 'en');

const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtLong = (d) => `${DAYFULL[L()][d.getDay()]} ${d.getDate()} ${MONFULL[L()][d.getMonth()]} ${d.getFullYear()}`;
const fmtShort = (d) => `${DAYSHORT[L()][d.getDay()]} ${d.getDate()} ${MON[L()][d.getMonth()]} ${d.getFullYear()}`;
const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const num = (n) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
const money = (n) => (n < 0 ? '−' : '') + db.cur + num(Math.abs(n));
const round2 = (n) => Math.round(n * 100) / 100;
const sorted = () => [...db.entries].sort((a, b) => a.ts - b.ts);

function totals() {
  let dep = 0, wd = 0;
  for (const e of db.entries) (e.type === 'dep' ? (dep += e.amount) : (wd += e.amount));
  return { dep: round2(dep), wd: round2(wd), bal: round2(dep - wd) };
}

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}
function svgEl(tag, attrs, ...kids) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
  for (const c of kids.flat()) if (c != null) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}
function toast(msg) {
  const el = h('div', { class: 'toast' }, msg);
  document.body.append(el);
  setTimeout(() => el.remove(), 1800);
}

/* ---------- frame ---------- */
function render() {
  const T = totals();
  $app.replaceChildren(
    h('div', { class: 'top' }, h('h1', {}, t('title')), h('button', { class: 'chip', type: 'button', onclick: openMenu }, '☰ ' + t('menu'))),
    h('div', { class: 'balance' }, h('small', {}, t('balance')), bigBalance(T.bal),
      h('div', { class: 'row' }, h('span', { class: 'up' }, `${t('deposited')} ${money(T.dep)}`))),
    tab === 'book' ? bookView() : chartsView(),
    h('nav', { class: 'tabbar' },
      h('button', { type: 'button', class: tab === 'book' ? 'on' : '', onclick: () => { tab = 'book'; render(); } }, '📒 ' + t('book')),
      h('button', { type: 'button', class: tab === 'charts' ? 'on' : '', onclick: () => { tab = 'charts'; render(); } }, '📊 ' + t('charts'))),
  );
}

function bigBalance(bal) {
  const txt = money(bal);
  const size = txt.length > 20 ? 18 : txt.length > 16 ? 22 : txt.length > 13 ? 26 : txt.length > 10 ? 32 : 38;
  return h('div', { class: 'big' + (bal < 0 ? ' down' : ''), style: `font-size:${size}px` }, txt);
}

/* ---------- notebook ---------- */
function bookView() {
  const all = sorted();
  let bal = 0;
  const rows = all.map((e, i) => { bal = round2(bal + (e.type === 'dep' ? e.amount : -e.amount)); return { e, n: i + 1, bal }; });
  const pages = Math.max(1, Math.ceil(rows.length / ROWS));
  let page = tablePage == null ? pages - 1 : Math.min(tablePage, pages - 1);
  tablePage = page;
  const slice = rows.slice(page * ROWS, page * ROWS + ROWS);
  const hasPrev = page > 0;
  const hasNext = rows.length > (page + 1) * ROWS;

  const trs = [];
  for (let i = 0; i < ROWS; i++) {
    const r = slice[i];
    const no = page * ROWS + i + 1;
    if (!r) { trs.push(h('tr', { class: 'blank' }, h('td', { class: 'no' }, no), h('td'), h('td'), h('td'), h('td'), h('td'), h('td'))); continue; }
    const d = new Date(r.e.ts);
    const dep = r.e.type === 'dep';
    const pencil = h('button', { class: 'pencil', type: 'button', 'aria-label': t('edit'), onclick: () => openEdit(r.e) }, '✎');
    trs.push(h('tr', { class: dep ? 'dep' : 'wd' },
      h('td', { class: 'no' }, no),
      h('td', { class: 'dt' }, h('div', {}, fmtShort(d)), h('div', { class: 'tm' }, fmtTime(d))),
      h('td', { class: 'ty' }, dep ? t('deposit') : t('withdraw')),
      h('td', { class: 'am' }, (dep ? '+' : '−') + num(r.e.amount)),
      h('td', { class: 'ba' + (r.bal < 0 ? ' neg' : '') }, money(r.bal)),
      h('td', { class: 'nt' }, r.e.note || ''),
      h('td', { class: 'ed' }, pencil)));
  }

  return h('div', {},
    h('div', { class: 'addrow' },
      h('button', { class: 'addbtn dep', type: 'button', onclick: () => openAdd('dep') }, '+ ' + t('deposit')),
      h('button', { class: 'addbtn wd', type: 'button', onclick: () => openAdd('wd') }, '− ' + t('withdraw'))),
    h('div', { class: 'pager' },
      hasPrev ? h('button', { class: 'nav', type: 'button', 'aria-label': t('prev'), onclick: () => { tablePage = page - 1; render(); } }, '‹') : h('span', { class: 'nav ph' }),
      h('b', {}, `${t('table')} ${page + 1}`),
      hasNext ? h('button', { class: 'nav', type: 'button', 'aria-label': t('next'), onclick: () => { tablePage = page + 1; render(); } }, '›') : h('span', { class: 'nav ph' })),
    h('div', { class: 'tablewrap' },
      h('table', { class: 'book' },
        h('thead', {}, h('tr', {}, h('th', {}, '#'), h('th', {}, t('date') + ' / ' + t('time')), h('th', {}, t('type')), h('th', {}, t('amt')), h('th', {}, t('bal')), h('th', {}, t('note')), h('th', {}))),
        h('tbody', {}, trs))));
}

/* ---------- add / edit ---------- */
function sheet(content) {
  const back = h('div', { class: 'back', onclick: (e) => { if (e.target === back) back.remove(); } }, h('div', { class: 'sheet' }, content));
  document.body.append(back);
  return back;
}

function openAdd(type) {
  const now = new Date();
  const amt = h('input', { class: 'input num', type: 'text', inputmode: 'decimal', placeholder: '0', autocomplete: 'off', 'aria-label': t('amount') });
  const note = h('input', { class: 'input', type: 'text', maxlength: '120', placeholder: t(type === 'dep' ? 'noteDep' : 'noteWd') });
  const err = h('div', { class: 'err' });
  const sh = sheet([
    h('h3', { class: type === 'dep' ? 'up' : 'down' }, (type === 'dep' ? '+ ' : '− ') + t(type === 'dep' ? 'deposit' : 'withdraw')),
    h('div', { class: 'stamp' }, `${fmtLong(now)} ${fmtTime(now)}`),
    amt, note, err,
    h('button', { class: 'save ' + type, type: 'button', onclick: save }, t(type === 'dep' ? 'saveDep' : 'saveWd')),
    h('button', { class: 'ghost', type: 'button', onclick: () => sh.remove() }, t('cancel')),
  ]);
  function save() {
    const n = round2(parseFloat(String(amt.value).replace(/,/g, '')));
    if (!Number.isFinite(n) || n <= 0 || n > MAX_AMOUNT) { err.textContent = t('badAmount'); return; }
    const at = new Date();
    const entry = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ts: at.getTime(), type, amount: n, note: note.value.trim() };
    db.entries.push(entry);
    persist();
    const idx = sorted().findIndex((x) => x.id === entry.id);
    tablePage = Math.floor(idx / ROWS);
    sh.remove();
    render();
    toast(t('saved'));
  }
  setTimeout(() => amt.focus(), 50);
}

function openEdit(e) {
  let type = e.type;
  const d = new Date(e.ts);
  const amt = h('input', { class: 'input num', type: 'text', inputmode: 'decimal', value: String(e.amount), 'aria-label': t('amount') });
  const note = h('input', { class: 'input', type: 'text', maxlength: '120', value: e.note || '', placeholder: t('note') });
  const err = h('div', { class: 'err' });
  const dep = h('button', { type: 'button', class: 'dep' + (type === 'dep' ? ' on' : '') }, '+ ' + t('deposit'));
  const wd = h('button', { type: 'button', class: 'wd' + (type === 'wd' ? ' on' : '') }, '− ' + t('withdraw'));
  const setType = (v) => { type = v; dep.classList.toggle('on', v === 'dep'); wd.classList.toggle('on', v === 'wd'); };
  dep.addEventListener('click', () => setType('dep'));
  wd.addEventListener('click', () => setType('wd'));
  const sh = sheet([
    h('h3', {}, t('edit')),
    h('div', { class: 'seg' }, dep, wd),
    amt, note,
    h('div', { class: 'stamp' }, `${fmtLong(d)} ${fmtTime(d)}`),
    err,
    h('button', { class: 'save dep', type: 'button', onclick: save }, t('saved').replace('Saved', 'Save').replace('บันทึกแล้ว', 'บันทึก')),
    h('button', { class: 'ghost danger', type: 'button', onclick: () => { if (!confirm(t('delAsk'))) return; db.entries = db.entries.filter((x) => x.id !== e.id); persist(); sh.remove(); render(); toast(t('deleted')); } }, t('del')),
    h('button', { class: 'ghost', type: 'button', onclick: () => sh.remove() }, t('cancel')),
  ]);
  function save() {
    const n = round2(parseFloat(String(amt.value).replace(/,/g, '')));
    if (!Number.isFinite(n) || n <= 0 || n > MAX_AMOUNT) { err.textContent = t('badAmount'); return; }
    Object.assign(e, { type, amount: n, note: note.value.trim() }); // the date and time stay as first saved
    persist(); sh.remove(); render(); toast(t('saved'));
  }
}

/* ---------- charts ---------- */
const COLORS = ['#2dd4bf', '#60a5fa', '#fbbf24', '#a78bfa', '#f472b6', '#34d399', '#94a3b8'];
const REDS = ['#fb7185', '#f97316', '#facc15', '#c084fc', '#f472b6', '#fb923c', '#94a3b8'];

function weekStart(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return x; }
function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

// Buckets for the chosen period. Days / months before the first ever entry and in the future are left out.
function buckets() {
  const first = db.entries.length ? new Date(Math.min(...db.entries.map((e) => e.ts))) : null;
  const today = new Date();
  const out = [];
  let title = '';
  const add = (label, from, to) => {
    let dep = 0, wd = 0;
    for (const e of db.entries) if (e.ts >= from.getTime() && e.ts < to.getTime()) (e.type === 'dep' ? (dep += e.amount) : (wd += e.amount));
    out.push({ label, dep: round2(dep), wd: round2(wd), from });
  };
  if (mode === 'week') {
    const s = weekStart(anchor);
    const e = new Date(s); e.setDate(e.getDate() + 6);
    title = `${s.getDate()} ${MON[L()][s.getMonth()]} – ${e.getDate()} ${MON[L()][e.getMonth()]} ${e.getFullYear()}`;
    for (let i = 0; i < 7; i++) {
      const a = new Date(s); a.setDate(s.getDate() + i);
      const b = new Date(a); b.setDate(a.getDate() + 1);
      if (first && b <= startOfDay(first)) continue;
      add(DAYFULL[L()][a.getDay()].replace('วัน', ''), a, b);
      if (a > today && !out[out.length - 1].dep && !out[out.length - 1].wd) out.pop();
    }
  } else if (mode === 'month') {
    const y = anchor.getFullYear(), m = anchor.getMonth();
    title = `${MONFULL[L()][m]} ${y}`;
    const n = new Date(y, m + 1, 0).getDate();
    for (let i = 1; i <= n; i++) {
      const a = new Date(y, m, i), b = new Date(y, m, i + 1);
      if (first && b <= startOfDay(first)) continue;
      add(`${i} ${MON[L()][m]}`, a, b);
      if (a > today && !out[out.length - 1].dep && !out[out.length - 1].wd) out.pop();
    }
  } else {
    const y = anchor.getFullYear();
    title = String(y);
    for (let m = 0; m < 12; m++) {
      const a = new Date(y, m, 1), b = new Date(y, m + 1, 1);
      if (first && b <= startOfDay(first)) continue;
      add(MON[L()][m], a, b);
      if (a > today && !out[out.length - 1].dep && !out[out.length - 1].wd) out.pop();
    }
  }
  return { list: out, title };
}

function shift(dir) {
  const a = new Date(anchor);
  if (mode === 'week') a.setDate(a.getDate() + 7 * dir);
  else if (mode === 'month') a.setMonth(a.getMonth() + dir, 1);
  else a.setFullYear(a.getFullYear() + dir, 0, 1);
  anchor = a;
  render();
}
function canShift(dir) {
  const a = new Date(anchor);
  if (mode === 'week') a.setDate(a.getDate() + 7 * dir);
  else if (mode === 'month') a.setMonth(a.getMonth() + dir, 1);
  else a.setFullYear(a.getFullYear() + dir, 0, 1);
  const now = new Date();
  if (dir > 0) {
    if (mode === 'week') return weekStart(a) <= now;
    if (mode === 'month') return a.getFullYear() < now.getFullYear() || (a.getFullYear() === now.getFullYear() && a.getMonth() <= now.getMonth());
    return a.getFullYear() <= now.getFullYear();
  }
  if (!db.entries.length) return false;
  const first = new Date(Math.min(...db.entries.map((e) => e.ts)));
  if (mode === 'week') return new Date(weekStart(a).getTime() + 7 * 864e5) > first;
  if (mode === 'month') return a.getFullYear() > first.getFullYear() || (a.getFullYear() === first.getFullYear() && a.getMonth() >= first.getMonth());
  return a.getFullYear() >= first.getFullYear();
}

function chartsView() {
  const { list, title } = buckets();
  const seg = h('div', { class: 'seg3' }, ['week', 'month', 'year'].map((m) => h('button', { type: 'button', class: mode === m ? 'on' : '', onclick: () => { mode = m; anchor = new Date(); render(); } }, t(m))));
  const nav = h('div', { class: 'pager' },
    canShift(-1) ? h('button', { class: 'nav', type: 'button', 'aria-label': t('prev'), onclick: () => shift(-1) }, '‹') : h('span', { class: 'nav ph' }),
    h('b', {}, title),
    canShift(1) ? h('button', { class: 'nav', type: 'button', 'aria-label': t('next'), onclick: () => shift(1) }, '›') : h('span', { class: 'nav ph' }));
  return h('div', {}, seg, nav, section('dep', list), section('wd', list));
}

function section(kind, list) {
  const key = kind === 'dep' ? 'dep' : 'wd';
  const cols = kind === 'dep' ? COLORS : REDS;
  const data = list.map((b) => ({ label: b.label, v: b[key] }));
  const sum = round2(data.reduce((a, b) => a + b.v, 0));
  const box = h('div', { class: 'card ' + kind }, h('h2', { class: kind === 'dep' ? 'up' : 'down' }, t(kind === 'dep' ? 'deposits' : 'withdrawals')));
  if (!sum) { box.append(h('div', { class: 'empty-msg' }, t('noData'))); return box; }
  const top = data.reduce((a, b) => (b.v > a.v ? b : a), data[0]);
  box.append(h('div', { class: 'topline' }, `${t(kind === 'dep' ? 'topDep' : 'topWd')}: `, h('b', { class: kind === 'dep' ? 'up' : 'down' }, `${top.label} · ${money(top.v)}`)));
  box.append(h('div', { class: 'scrollx' }, barChart(data, kind === 'dep' ? '#2dd4bf' : '#fb7185', top)));
  box.append(pieChart(data, cols, sum));
  return box;
}

function barChart(data, color, top) {
  const W = Math.max(320, data.length * 34 + 20), H = 190, pb = 34, pt = 22, pl = 8;
  const max = Math.max(...data.map((d) => d.v), 1);
  const bw = Math.min(40, (W - pl * 2) / data.length - 6);
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img' });
  data.forEach((d, i) => {
    const x = pl + i * ((W - pl * 2) / data.length) + ((W - pl * 2) / data.length - bw) / 2;
    const bh = d.v ? Math.max(3, ((H - pb - pt) * d.v) / max) : 0;
    const y = H - pb - bh;
    svg.append(svgEl('rect', { x, y, width: bw, height: bh, rx: 4, fill: color, opacity: d === top ? 1 : 0.55 }));
    if (d.v) svg.append(svgEl('text', { x: x + bw / 2, y: y - 5, 'text-anchor': 'middle', fill: '#eaf2f8', 'font-size': 10 }, shortNum(d.v)));
    let lab = d.label.length > 9 && data.length > 7 ? d.label.split(' ')[0] : d.label;
    if (mode === 'week' && L() === 'en' && data.length > 4) lab = lab.slice(0, 3);
    svg.append(svgEl('text', { x: x + bw / 2, y: H - pb + 15, 'text-anchor': 'middle', fill: '#8ea3b5', 'font-size': 10 }, lab.length > 10 ? lab.slice(0, 9) + '…' : lab));
  });
  return svg;
}
const shortNum = (n) => (n >= 1e6 ? round2(n / 1e6) + 'M' : n >= 1e4 ? round2(n / 1e3) + 'k' : String(round2(n)));

function pieChart(data, cols, sum) {
  let items = data.filter((d) => d.v > 0).sort((a, b) => b.v - a.v);
  if (items.length > 7) {
    const rest = round2(items.slice(6).reduce((a, b) => a + b.v, 0));
    items = [...items.slice(0, 6), { label: t('other'), v: rest }];
  }
  const R = 70, C = 80;
  const svg = svgEl('svg', { viewBox: '0 0 160 160', width: 160, height: 160, role: 'img' });
  let a0 = -Math.PI / 2;
  if (items.length === 1) svg.append(svgEl('circle', { cx: C, cy: C, r: R, fill: cols[0] }));
  else items.forEach((it, i) => {
    const a1 = a0 + (it.v / sum) * Math.PI * 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = `M ${C} ${C} L ${C + R * Math.cos(a0)} ${C + R * Math.sin(a0)} A ${R} ${R} 0 ${large} 1 ${C + R * Math.cos(a1)} ${C + R * Math.sin(a1)} Z`;
    svg.append(svgEl('path', { d: p, fill: cols[i % cols.length], stroke: '#17212c', 'stroke-width': 1 }));
    a0 = a1;
  });
  const legend = h('div', { class: 'legend' }, items.map((it, i) => h('div', { class: 'lg' }, h('span', { class: 'dot', style: `background:${cols[i % cols.length]}` }), h('span', { class: 'lgl' }, it.label), h('span', { class: 'lgv' }, `${money(it.v)} · ${Math.round((it.v / sum) * 100)}%`))));
  return h('div', { class: 'pie' }, svg, legend);
}

/* ---------- menu / backup ---------- */
function openMenu() {
  const sh = sheet(h('div', { class: 'menu' }, [
    h('div', { class: 'langrow' }, h('b', {}, t('language')),
      h('div', { class: 'seg' }, ['en', 'th'].map((c) => h('button', { type: 'button', class: 'lang' + (db.lang === c ? ' on' : ''), onclick: () => { db.lang = c; persist(); sh.remove(); render(); openMenu(); } }, c === 'en' ? 'English' : 'ไทย')))),
    h('button', { type: 'button', onclick: () => { db.sound = db.sound === false; persist(); sh.remove(); toast(db.sound ? 'Sound on' : 'Sound off'); } }, t('sound') + (db.sound === false ? ' (off)' : ' (on)')),
    h('button', { type: 'button', onclick: () => { const v = prompt(t('currencyAsk'), db.cur); if (v != null && v.trim()) { db.cur = v.trim().slice(0, 4); persist(); sh.remove(); render(); } } }, t('currency')),
    h('button', { type: 'button', onclick: () => download('daily-jar.csv', 'text/csv', csv()) }, t('csv')),
    h('button', { type: 'button', onclick: () => download('daily-jar-backup.json', 'application/json', JSON.stringify(db)) }, t('backup')),
    h('button', { type: 'button', onclick: () => restore(sh) }, t('restore')),
    h('button', { type: 'button', class: 'danger', onclick: () => { if (confirm(t('resetAsk'))) { db.entries = []; tablePage = null; persist(); sh.remove(); render(); } } }, t('reset')),
    h('button', { type: 'button', onclick: () => sh.remove() }, t('close')),
  ]));
}
function csv() {
  const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  const rows = [['date', 'time', 'type', 'amount', 'note']];
  sorted().forEach((e) => { const d = new Date(e.ts); rows.push([dayKey(d), fmtTime(d), e.type === 'dep' ? 'deposit' : 'withdraw', e.amount, e.note || '']); });
  return '﻿' + rows.map((r) => r.map(q).join(',')).join('\n');
}
function download(name, type, text) {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function restore(sh) {
  const inp = h('input', { type: 'file', accept: 'application/json,.json', style: 'position:fixed;left:-9999px' });
  inp.addEventListener('change', async () => {
    try {
      const d = JSON.parse(await inp.files[0].text());
      if (!d || !Array.isArray(d.entries)) throw new Error('bad');
      db = { lang: d.lang === 'th' ? 'th' : 'en', cur: typeof d.cur === 'string' ? d.cur : '฿', sound: d.sound !== false, entries: d.entries.filter(okEntry) };
      tablePage = null; persist(); sh.remove(); render(); toast(t('restored'));
    } catch { toast(t('badFile')); }
    inp.remove();
  });
  document.body.append(inp); inp.click();
}

render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
