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
    ],
  },
];

const grid = document.getElementById('grid');
const picker = document.getElementById('picker');
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

async function copySticker(src) {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') throw new Error('unsupported');
  // Pass a promise so Safari keeps the click's user activation while the image loads.
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob(src) })]);
}

function renderGrid(character) {
  grid.replaceChildren();
  for (const [file, label] of character.stickers) {
    const src = `stickers/${character.id}/${file}.png`;
    const btn = document.createElement('button');
    btn.className = 'sticker';
    btn.title = `Copy "${label}"`;
    btn.innerHTML = `<img src="${src}" alt="${character.name}: ${label}" loading="lazy"><span>${label}</span>`;
    btn.addEventListener('click', async () => {
      try {
        await copySticker(src);
        showToast('Copied! Paste it into Teams');
      } catch (err) {
        console.warn(err);
        showToast('Your browser blocked copying. Right-click the sticker and choose "Copy image".', true);
      }
    });
    grid.appendChild(btn);
  }
}

function selectCharacter(id) {
  const character = CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
  for (const tab of picker.children) {
    tab.setAttribute('aria-selected', String(tab.dataset.id === character.id));
  }
  renderGrid(character);
}

for (const character of CHARACTERS) {
  const tab = document.createElement('button');
  tab.className = 'character';
  tab.setAttribute('role', 'tab');
  tab.dataset.id = character.id;
  tab.innerHTML = `<img src="stickers/${character.id}/${character.avatar}.png" alt=""><span>${character.name}</span>`;
  tab.addEventListener('click', () => {
    // Keep the choice in the address so a link can open straight to a character.
    history.replaceState(null, '', '#' + character.id);
    selectCharacter(character.id);
  });
  picker.appendChild(tab);
}

selectCharacter(location.hash.slice(1));
