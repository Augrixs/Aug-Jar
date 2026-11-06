'use strict';
/* Savings Log: a simple deposit / withdraw notebook. Data stays on this device (localStorage). Years are always CE. */

const KEY = 'aug-jar-v1';
const MON = { en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], th: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'] };
const MONFULL = { en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], th: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'] };
const DOW = { en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'], th: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'] };
const TX = {
  title: ['Savings Log', 'สมุดออมเงิน'],
  balance: ['Savings', 'เงินออมคงเหลือ'],
  deposited: ['Deposited', 'ฝากรวม'],
  withdrawn: ['Withdrawn', 'ถอนรวม'],
  add: ['+ Add', '+ บันทึก'],
  deposit: ['Deposit', 'ฝาก'],
  withdraw: ['Withdraw', 'ถอน'],
  amount: ['Amount', 'จำนวนเงิน'],
  noteDep: ['Where did it come from? (optional)', 'ได้มาจากไหน (ไม่บังคับ)'],
  noteWd: ['What was it for? (optional)', 'เอาไปทำอะไร (ไม่บังคับ)'],
  save: ['Save', 'บันทึก'],
  cancel: ['Cancel', 'ยกเลิก'],
  history: ['History', 'ประวัติ'],
  none: ['Nothing saved yet. Tap + Add.', 'ยังไม่มีรายการ กด + บันทึก'],
  badAmount: ['Type an amount above 0', 'ใส่จำนวนเงินมากกว่า 0'],
  tooMuch: ['Not enough savings to withdraw that', 'เงินออมไม่พอให้ถอน'],
  saved: ['Saved', 'บันทึกแล้ว'],
  del: ['Delete this entry', 'ลบรายการนี้'],
  delAsk: ['Delete this entry? The balance changes.', 'ลบรายการนี้ใช่ไหม ยอดคงเหลือจะเปลี่ยน'],
  deleted: ['Deleted', 'ลบแล้ว'],
  menu: ['Menu', 'เมนู'],
  lang: ['Language: English → ไทย', 'ภาษา: ไทย → English'],
  currency: ['Change currency symbol', 'เปลี่ยนสัญลักษณ์เงิน'],
  currencyAsk: ['Currency symbol (for example ฿ or $)', 'สัญลักษณ์เงิน (เช่น ฿ หรือ $)'],
  csv: ['Export CSV', 'ส่งออก CSV'],
  backup: ['Back up (JSON file)', 'สำรองข้อมูล (ไฟล์ JSON)'],
  restore: ['Restore from backup', 'กู้คืนจากไฟล์สำรอง'],
  restored: ['Restored', 'กู้คืนแล้ว'],
  badFile: ['That file is not a backup', 'ไฟล์นี้ไม่ใช่ไฟล์สำรอง'],
  reset: ['Delete everything', 'ลบข้อมูลทั้งหมด'],
  resetAsk: ['Delete ALL entries on this device? This cannot be undone.', 'ลบรายการทั้งหมดในเครื่องนี้ใช่ไหม กู้คืนไม่ได้'],
  logged: ['Logged', 'บันทึกเมื่อ'],
  close: ['Close', 'ปิด'],
  today: ['Today', 'วันนี้'],
};

let db = load();
let view = (() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; })();
const $app = document.getElementById('app');

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (d && Array.isArray(d.entries)) return { lang: d.lang === 'th' ? 'th' : 'en', cur: typeof d.cur === 'string' ? d.cur : '฿', entries: d.entries.filter(okEntry) };
  } catch { /* fresh start */ }
  return { lang: 'en', cur: '฿', entries: [] };
}
function okEntry(e) { return e && (e.type === 'dep' || e.type === 'wd') && Number.isFinite(e.amount) && e.amount > 0 && Number.isFinite(e.ts); }
function persist() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { toast('Storage is full or blocked'); } }
const t = (k) => TX[k][db.lang === 'th' ? 1 : 0];

const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDate = (d) => `${d.getDate()} ${MON[db.lang][d.getMonth()]} ${d.getFullYear()}`;
const fmtTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const money = (n) => db.cur + new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
const round2 = (n) => Math.round(n * 100) / 100;

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

function toast(msg) {
  const el = h('div', { class: 'toast' }, msg);
  document.body.append(el);
  setTimeout(() => el.remove(), 1800);
}

/* ---------- main screen ---------- */
function render() {
  const T = totals();
  const byDay = new Map();
  for (const e of db.entries) {
    const k = dayKey(new Date(e.ts));
    const cur = byDay.get(k) || 0;
    byDay.set(k, round2(cur + (e.type === 'dep' ? e.amount : -e.amount)));
  }

  const first = new Date(view.y, view.m, 1);
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const todayKey = dayKey(new Date());
  const cells = [];
  DOW[db.lang].forEach((d) => cells.push(h('div', { class: 'dow' }, d)));
  for (let i = 0; i < first.getDay(); i++) cells.push(h('div', { class: 'day empty' }));
  for (let d = 1; d <= days; d++) {
    const k = `${view.y}-${pad(view.m + 1)}-${pad(d)}`;
    const net = byDay.get(k);
    const btn = h('button', { class: 'day' + (k === todayKey ? ' today' : '') + (net != null ? ' has' : ''), type: 'button', onclick: () => openAdd(new Date(view.y, view.m, d)) },
      h('span', {}, d), net != null ? h('small', { class: net >= 0 ? 'up' : 'down' }, (net >= 0 ? '+' : '−') + shortNum(Math.abs(net))) : null);
    cells.push(btn);
  }

  const sorted = [...db.entries].sort((a, b) => b.ts - a.ts);
  const list = [];
  let lastDay = '';
  for (const e of sorted) {
    const d = new Date(e.ts);
    const k = dayKey(d);
    if (k !== lastDay) { list.push(h('h2', {}, fmtDate(d))); lastDay = k; }
    list.push(h('button', { class: 'item', type: 'button', onclick: () => openEntry(e) },
      h('span', { class: 'amt ' + (e.type === 'dep' ? 'up' : 'down') }, (e.type === 'dep' ? '+' : '−') + money(e.amount)),
      h('span', { class: 'grow' }, h('div', { class: 'note' }, e.note || (e.type === 'dep' ? t('deposit') : t('withdraw'))), h('div', { class: 'when' }, `${fmtDate(d)} ${fmtTime(d)}`))));
  }

  $app.replaceChildren(
    h('div', { class: 'top' }, h('h1', {}, t('title')), h('button', { class: 'chip', type: 'button', onclick: openMenu }, '☰ ' + t('menu'))),
    h('div', { class: 'balance' }, h('small', {}, t('balance')), h('div', { class: 'big' }, money(T.bal)),
      h('div', { class: 'row' }, h('span', { class: 'up' }, `${t('deposited')} ${money(T.dep)}`))),
    h('div', { class: 'cal' },
      h('div', { class: 'calhead' }, h('button', { class: 'nav', type: 'button', 'aria-label': 'Previous month', onclick: () => step(-1) }, '‹'),
        h('b', {}, `${MONFULL[db.lang][view.m]} ${view.y}`), h('button', { class: 'nav', type: 'button', 'aria-label': 'Next month', onclick: () => step(1) }, '›')),
      h('div', { class: 'grid' }, cells)),
    h('h2', {}, t('history')),
    ...(sorted.length ? list : [h('div', { class: 'empty-msg' }, t('none'))]),
    h('button', { class: 'fab', type: 'button', onclick: () => openAdd(new Date()) }, t('add')),
  );
}
const shortNum = (n) => (n >= 1e6 ? round2(n / 1e6) + 'M' : n >= 1e4 ? round2(n / 1e3) + 'k' : String(round2(n)));
function step(dm) { const d = new Date(view.y, view.m + dm, 1); view = { y: d.getFullYear(), m: d.getMonth() }; render(); }

/* ---------- sheets ---------- */
function sheet(content) {
  const back = h('div', { class: 'back', onclick: (e) => { if (e.target === back) back.remove(); } }, h('div', { class: 'sheet' }, content));
  document.body.append(back);
  return back;
}

function openAdd(date) {
  let type = 'dep';
  const amt = h('input', { class: 'input num', type: 'text', inputmode: 'decimal', placeholder: '0', autocomplete: 'off', 'aria-label': t('amount') });
  const note = h('input', { class: 'input', type: 'text', maxlength: '120', placeholder: t('noteDep') });
  const err = h('div', { class: 'err' });
  const dep = h('button', { type: 'button', class: 'dep on' }, '+ ' + t('deposit'));
  const wd = h('button', { type: 'button', class: 'wd' }, '− ' + t('withdraw'));
  const setType = (v) => { type = v; dep.classList.toggle('on', v === 'dep'); wd.classList.toggle('on', v === 'wd'); note.placeholder = t(v === 'dep' ? 'noteDep' : 'noteWd'); err.textContent = ''; };
  dep.addEventListener('click', () => setType('dep'));
  wd.addEventListener('click', () => setType('wd'));
  const sh = sheet([
    h('h3', {}, fmtDate(date)),
    h('div', { class: 'when', style: 'color:var(--muted);font-size:13px' }, dayKey(date) === dayKey(new Date()) ? t('today') : ''),
    h('div', { class: 'seg' }, dep, wd),
    amt, note, err,
    h('button', { class: 'save', type: 'button', onclick: save }, t('save')),
    h('button', { class: 'ghost', type: 'button', onclick: () => sh.remove() }, t('cancel')),
  ]);
  function save() {
    const n = round2(parseFloat(String(amt.value).replace(/,/g, '')));
    if (!Number.isFinite(n) || n <= 0) { err.textContent = t('badAmount'); return; }
    if (type === 'wd' && n > totals().bal) { err.textContent = t('tooMuch'); return; }
    const now = new Date();
    const when = new Date(date.getFullYear(), date.getMonth(), date.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
    db.entries.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ts: when.getTime(), type, amount: n, note: note.value.trim() });
    persist();
    view = { y: when.getFullYear(), m: when.getMonth() };
    sh.remove();
    render();
    toast(t('saved'));
  }
  setTimeout(() => amt.focus(), 50);
}

function openEntry(e) {
  const d = new Date(e.ts);
  const sh = sheet([
    h('h3', { class: e.type === 'dep' ? 'up' : 'down' }, (e.type === 'dep' ? '+' : '−') + money(e.amount)),
    h('p', {}, e.note || (e.type === 'dep' ? t('deposit') : t('withdraw'))),
    h('p', { style: 'color:var(--muted)' }, `${t('logged')} ${fmtDate(d)} ${fmtTime(d)}`),
    h('button', { class: 'ghost danger', type: 'button', onclick: () => {
      if (!confirm(t('delAsk'))) return;
      db.entries = db.entries.filter((x) => x.id !== e.id);
      persist(); sh.remove(); render(); toast(t('deleted'));
    } }, t('del')),
    h('button', { class: 'ghost', type: 'button', onclick: () => sh.remove() }, t('close')),
  ]);
}

function openMenu() {
  const sh = sheet(h('div', { class: 'menu' }, [
    h('button', { type: 'button', onclick: () => { db.lang = db.lang === 'en' ? 'th' : 'en'; persist(); sh.remove(); render(); } }, t('lang')),
    h('button', { type: 'button', onclick: () => { const v = prompt(t('currencyAsk'), db.cur); if (v != null && v.trim()) { db.cur = v.trim().slice(0, 4); persist(); sh.remove(); render(); } } }, t('currency')),
    h('button', { type: 'button', onclick: () => { download('savings.csv', 'text/csv', csv()); } }, t('csv')),
    h('button', { type: 'button', onclick: () => { download('savings-backup.json', 'application/json', JSON.stringify(db)); } }, t('backup')),
    h('button', { type: 'button', onclick: () => restore(sh) }, t('restore')),
    h('button', { type: 'button', class: 'danger', onclick: () => { if (confirm(t('resetAsk'))) { db.entries = []; persist(); sh.remove(); render(); } } }, t('reset')),
    h('button', { type: 'button', onclick: () => sh.remove() }, t('close')),
  ]));
}

function csv() {
  const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  const rows = [['date', 'time', 'type', 'amount', 'note']];
  [...db.entries].sort((a, b) => a.ts - b.ts).forEach((e) => { const d = new Date(e.ts); rows.push([dayKey(d), fmtTime(d), e.type === 'dep' ? 'deposit' : 'withdraw', e.amount, e.note || '']); });
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
      db = { lang: d.lang === 'th' ? 'th' : 'en', cur: typeof d.cur === 'string' ? d.cur : '฿', entries: d.entries.filter(okEntry) };
      persist(); sh.remove(); render(); toast(t('restored'));
    } catch { toast(t('badFile')); }
    inp.remove();
  });
  document.body.append(inp); inp.click();
}

render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
