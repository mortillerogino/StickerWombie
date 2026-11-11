const STICKERS = [
  ['01-laughing', 'Laughing'], ['02-crying', 'Crying'], ['03-get-back-to-work', 'Get back to work!'],
  ['04-thumbs-up', 'Thumbs up'], ['05-shocked', 'Shocked'], ['06-love-savings', 'Love savings'],
  ['07-sleepy', 'Sleepy'], ['08-celebrate', 'Celebrate'], ['09-thinking', 'Thinking'],
  ['10-youve-got-this', "You've got this!"], ['11-money', 'Money'], ['12-facepalm', 'Facepalm'],
];

const grid = document.getElementById('grid');
const toast = document.getElementById('toast');
let toastTimer;

function showToast(msg, warn = false) {
  toast.textContent = msg;
  toast.classList.toggle('warn', warn);
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), warn ? 4000 : 1800);
}

// Browsers refuse fetch() on file:// pages, so when the page is opened as a local
// file we load embedded copies of the stickers instead.
const isLocalFile = location.protocol === 'file:';
if (isLocalFile) {
  const s = document.createElement('script');
  s.src = 'stickers/data.js';
  document.head.appendChild(s);
}

async function pngBlob(src) {
  if (isLocalFile) {
    const name = src.split('/').pop().replace('.png', '');
    const b64 = window.STICKER_DATA && window.STICKER_DATA[name];
    if (!b64) throw new Error('Embedded sticker not loaded: ' + name);
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new Blob([bytes], { type: 'image/png' });
  }
  const res = await fetch(src);
  if (!res.ok) throw new Error('Could not load ' + src);
  return new Blob([await res.arrayBuffer()], { type: 'image/png' });
}

// Test mode: open the site with ?html in the address to also put an HTML <img> that
// points at the hosted PNG on the clipboard. Apps that prefer HTML then load the
// original file instead of the bitmap Windows keeps on the clipboard.
const HTML_MODE = new URLSearchParams(location.search).has('html') && !isLocalFile;

async function copySticker(src, label) {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') throw new Error('unsupported');
  // Pass a promise so Safari keeps the click's user activation while the image loads.
  const data = { 'image/png': pngBlob(src) };
  if (HTML_MODE) {
    const url = new URL(src, location.href).href;
    data['text/html'] = new Blob([`<img src="${url}" alt="${label}">`], { type: 'text/html' });
  }
  await navigator.clipboard.write([new ClipboardItem(data)]);
}

for (const [file, label] of STICKERS) {
  const src = `stickers/${file}.png`;
  const btn = document.createElement('button');
  btn.className = 'sticker';
  btn.title = `Copy "${label}"`;
  btn.innerHTML = `<img src="${src}" alt="${label}" loading="lazy"><span>${label}</span>`;
  btn.addEventListener('click', async () => {
    try {
      await copySticker(src, label);
      showToast('Copied! Paste it into Teams');
    } catch (err) {
      console.warn(err);
      showToast('Your browser blocked copying. Right-click the sticker and choose "Copy image".', true);
    }
  });
  grid.appendChild(btn);
}
