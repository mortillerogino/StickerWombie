// Each character has a folder under stickers/ and a list of [file, label] pairs.
// The first character is the one shown when the page opens.
const CHARACTERS = [
  {
    id: 'wombie',
    name: 'Wombie',
    avatar: '04-thumbs-up',
    stickers: [
      ['01-laughing', 'Laughing'], ['02-crying', 'Crying'], ['03-get-back-to-work', 'Get back to work!'],
      ['04-thumbs-up', 'Thumbs up'], ['05-shocked', 'Shocked'], ['06-love-savings', 'Love savings'],
      ['07-sleepy', 'Sleepy'], ['08-celebrate', 'Celebrate'], ['09-thinking', 'Thinking'],
      ['10-youve-got-this', "You've got this!"], ['11-money', 'Money'], ['12-facepalm', 'Facepalm'],
    ],
  },
  {
    id: 'case-manager-bm',
    name: 'Case Manager BM',
    avatar: '05-thumbs-up',
    stickers: [
      ['01-on-the-phone', 'On the phone'], ['02-laughing', 'Laughing'], ['03-crying', 'Crying'],
      ['04-get-back-to-work', 'Get back to work!'], ['05-thumbs-up', 'Thumbs up'], ['06-shocked', 'Shocked'],
      ['07-love-savings', 'Love savings'], ['08-sleepy', 'Sleepy'], ['09-celebrate', 'Celebrate'],
      ['10-thinking', 'Thinking'], ['11-youve-got-this', "You've got this!"], ['12-facepalm', 'Facepalm'],
      ['13-all-good', 'All good'], ['14-copy', 'Copy!'], ['15-overwhelmed', 'Overwhelmed'],
      ['16-on-a-call', 'On a call'], ['17-on-it', 'On it!'], ['18-approved', 'Approved!'],
      ['19-tea-time', 'Tea time'], ['20-thank-you', 'Thank you!'], ['21-hmm', 'Hmm...'],
      ['22-hello', 'Hello!'], ['23-lunch', 'Lunch?'], ['24-logging-off', 'Logging off!'],
    ],
  },
];

const grid = document.getElementById('grid');
const picker = document.getElementById('picker');
const indicator = picker.querySelector('.indicator');
const countEl = document.getElementById('count');
const toast = document.getElementById('toast');
const toastImg = document.getElementById('toast-img');
const toastText = document.getElementById('toast-text');
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
let toastTimer;
if (isMac) document.getElementById('paste-keys').innerHTML = '<kbd>⌘</kbd><kbd>V</kbd>';

// Small WebP copies are shown on the page; the full PNG is what gets copied.
const displaySrc = (id, file) => `stickers/${id}/web/${file}.webp`;
const fullSrc = (id, file) => `stickers/${id}/${file}.png`;

function showToast(html, { warn = false, img = '' } = {}) {
  toastText.innerHTML = html;
  toast.classList.toggle('warn', warn);
  if (img) toastImg.src = img;
  // Restart the entrance if a toast is already showing, so each copy is acknowledged.
  if (toast.classList.contains('show')) {
    toast.classList.remove('show');
    void toast.offsetWidth;
  }
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), warn ? 4200 : 2200);
}

// Browsers refuse fetch() on file:// pages, so when the page is opened as a local
// file we load embedded copies of the stickers instead.
const isLocalFile = location.protocol === 'file:';
if (isLocalFile) {
  const s = document.createElement('script');
  s.src = 'stickers/data.js';
  document.head.appendChild(s);
}

async function loadPng(src) {
  if (isLocalFile) {
    const key = src.replace(/^stickers\//, '').replace(/\.png$/, '');
    const b64 = window.STICKER_DATA && window.STICKER_DATA[key];
    if (!b64) throw new Error('Embedded sticker not loaded: ' + key);
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new Blob([bytes], { type: 'image/png' });
  }
  const res = await fetch(src);
  if (!res.ok) throw new Error('Could not load ' + src);
  return new Blob([await res.arrayBuffer()], { type: 'image/png' });
}

// Start fetching the full PNG as soon as the pointer reaches a sticker, so the copy is instant.
const pngCache = new Map();
function pngBlob(src) {
  if (!pngCache.has(src)) {
    const p = loadPng(src);
    p.catch(() => pngCache.delete(src));
    pngCache.set(src, p);
  }
  return pngCache.get(src);
}

async function copySticker(src) {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') throw new Error('unsupported');
  // Pass a promise so Safari keeps the click's user activation while the image loads.
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob(src) })]);
}

const CHECK_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const pasteKeys = isMac ? '<kbd>⌘</kbd><kbd>V</kbd>' : '<kbd>Ctrl</kbd><kbd>V</kbd>';

function renderGrid(character) {
  const frag = document.createDocumentFragment();
  character.stickers.forEach(([file, label], i) => {
    const src = fullSrc(character.id, file);
    const btn = document.createElement('button');
    btn.className = 'sticker';
    btn.type = 'button';
    btn.title = `Copy "${label}"`;
    // A gentle, stable scatter so the page feels like a sticker sheet.
    btn.style.setProperty('--tilt', `${[-2.2, 1.6, -1, 2.4, -1.8, 1.1][i % 6]}deg`);
    btn.style.setProperty('--n', i);
    btn.innerHTML =
      `<span class="frame"><img alt="${character.name}: ${label}" decoding="async"` +
      ` loading="${i < 8 ? 'eager' : 'lazy'}"${i < 4 ? ' fetchpriority="high"' : ''}>` +
      `<span class="copied" aria-hidden="true">${CHECK_SVG}</span></span><span class="label">${label}</span>`;
    const img = btn.querySelector('img');
    const reveal = () => btn.classList.add('loaded');
    img.addEventListener('load', reveal, { once: true });
    img.addEventListener('error', reveal, { once: true });
    img.src = displaySrc(character.id, file);
    if (img.complete) reveal();

    btn.addEventListener('pointerenter', () => { if (!isLocalFile) pngBlob(src); }, { once: true });
    let copiedTimer;
    btn.addEventListener('click', async () => {
      try {
        await copySticker(src);
        btn.classList.add('just-copied');
        clearTimeout(copiedTimer);
        copiedTimer = setTimeout(() => btn.classList.remove('just-copied'), 1400);
        showToast(`Copied! Paste into Teams with ${pasteKeys}`, { img: img.currentSrc || img.src });
      } catch (err) {
        console.warn(err);
        showToast('Your browser blocked copying. Right-click (or long-press) the sticker and choose "Copy image".', { warn: true });
      }
    });
    frag.appendChild(btn);
  });
  grid.replaceChildren(frag);
  countEl.textContent = `${character.stickers.length} stickers`;
}

// Warm the browser cache for a character's pictures (used when hovering its tab).
const warmed = new Set();
function warm(character) {
  if (!character || warmed.has(character.id)) return;
  warmed.add(character.id);
  for (const [file] of character.stickers.slice(0, 12)) {
    const img = new Image();
    img.decoding = 'async';
    img.src = displaySrc(character.id, file);
  }
}

function moveIndicator(tab, animate) {
  if (!tab) return;
  indicator.classList.toggle('no-anim', !animate);
  indicator.style.width = tab.offsetWidth + 'px';
  indicator.style.transform = `translateX(${tab.offsetLeft}px)`;
}

const requestSection = document.getElementById('request');
const REQUEST_ID = 'request';
let currentId = null;

// Shows a character's stickers, or the "Request Sticker" form when id is REQUEST_ID.
function selectCharacter(id, animate = true) {
  const showRequest = id === REQUEST_ID;
  const character = CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
  const selectedId = showRequest ? REQUEST_ID : character.id;
  if (selectedId === currentId) return;
  currentId = selectedId;
  let activeTab;
  for (const tab of picker.querySelectorAll('.tab')) {
    const on = tab.dataset.id === selectedId;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    if (on) activeTab = tab;
  }
  moveIndicator(activeTab, animate);
  activeTab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: animate ? 'smooth' : 'auto' });
  grid.hidden = showRequest;
  requestSection.hidden = !showRequest;
  countEl.hidden = showRequest;
  document.body.classList.toggle('requesting', showRequest);
  if (!showRequest) renderGrid(character);
}

function addTab(id, className, html) {
  const tab = document.createElement('button');
  tab.className = className;
  tab.type = 'button';
  tab.setAttribute('role', 'tab');
  tab.dataset.id = id;
  tab.innerHTML = html;
  tab.addEventListener('click', () => {
    // Keep the choice in the address so a link can open straight to a tab.
    history.replaceState(null, '', '#' + id);
    selectCharacter(id);
  });
  tab.addEventListener('pointerenter', () => warm(CHARACTERS.find(c => c.id === id)));
  picker.appendChild(tab);
}

addTab(REQUEST_ID, 'tab request-tab', '<span class="plus" aria-hidden="true">+</span><span class="tab-text">Request Sticker</span>');
for (const character of CHARACTERS) {
  addTab(character.id, 'tab',
    `<span class="avatar"><img src="${displaySrc(character.id, character.avatar)}" alt="" width="34" height="34"></span><span>${character.name}</span>`);
}

// Arrow keys move between tabs, as with any tab list.
picker.addEventListener('keydown', e => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  const tabs = [...picker.querySelectorAll('.tab')];
  const i = tabs.indexOf(document.activeElement);
  if (i < 0) return;
  const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
  next.focus();
  next.click();
});

window.addEventListener('hashchange', () => selectCharacter(location.hash.slice(1)));
selectCharacter(location.hash.slice(1), false);

// Re-measure the indicator once the custom fonts have arrived and on resize.
const remeasure = () => moveIndicator(picker.querySelector('.tab[aria-selected="true"]'), false);
document.fonts && document.fonts.ready.then(remeasure);
window.addEventListener('resize', remeasure);

// Frost the character bar once it sticks to the top.
const bar = document.querySelector('.bar');
const sentinel = document.createElement('div');
bar.before(sentinel);
new IntersectionObserver(([e]) => bar.classList.toggle('stuck', !e.isIntersecting)).observe(sentinel);

// Once the page is idle, quietly fetch the other characters' pictures.
(window.requestIdleCallback || (cb => setTimeout(cb, 1500)))(() => CHARACTERS.forEach(warm));
