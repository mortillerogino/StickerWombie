// "Would you like to be added as a sticker?" form.
// Submissions go to Netlify Forms (form name: sticker-request). Netlify accepts at most
// 8 MB per submission, so photos are accepted up to 25 MB and then resized in the
// browser before sending.

const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 7 * 1024 * 1024; // leaves room for the other fields under 8 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg'];

const form = document.getElementById('request-form');
const fileInput = document.getElementById('photo');
const dropzone = document.getElementById('dropzone');
const emptyView = dropzone.querySelector('.dz-empty');
const previewView = dropzone.querySelector('.dz-preview');
const previewImg = document.getElementById('photo-preview');
const previewName = document.getElementById('photo-name');
const submitBtn = document.getElementById('request-submit');
const statusEl = document.getElementById('request-status');

let chosenFile = null;

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle('error', isError);
}

function formatSize(bytes) {
  return bytes >= 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + ' MB' : Math.round(bytes / 1024) + ' KB';
}

function acceptFile(file) {
  if (!file) return;
  if (!ALLOWED_TYPES.includes(file.type)) {
    setStatus('Please choose a PNG or JPG image.', true);
    return;
  }
  if (file.size > MAX_INPUT_BYTES) {
    setStatus(`That file is ${formatSize(file.size)}. Please choose one up to 25 MB.`, true);
    return;
  }
  chosenFile = file;
  if (previewImg.src) URL.revokeObjectURL(previewImg.src);
  previewImg.src = URL.createObjectURL(file);
  previewName.textContent = `${file.name} · ${formatSize(file.size)} · click or drop to change`;
  emptyView.hidden = true;
  previewView.hidden = false;
  setStatus('');
}

fileInput.addEventListener('change', () => acceptFile(fileInput.files[0]));

for (const type of ['dragenter', 'dragover']) {
  dropzone.addEventListener(type, e => { e.preventDefault(); dropzone.classList.add('dragover'); });
}
for (const type of ['dragleave', 'drop']) {
  dropzone.addEventListener(type, () => dropzone.classList.remove('dragover'));
}
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  acceptFile(file);
  if (file && chosenFile === file) {
    // Keep the real input in sync so the browser's "required" check passes.
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
  }
});

function canvasToBlob(canvas, type, quality) {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

// Returns a File no larger than MAX_UPLOAD_BYTES, shrinking or re-encoding if needed.
async function fitForUpload(file) {
  if (file.size <= MAX_UPLOAD_BYTES) return file;
  const bitmap = await createImageBitmap(file);
  const baseName = file.name.replace(/\.[^.]+$/, '');
  for (const maxSide of [3000, 2400, 2000, 1600]) {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    if (file.type === 'image/png') {
      const png = await canvasToBlob(canvas, 'image/png');
      if (png && png.size <= MAX_UPLOAD_BYTES) return new File([png], baseName + '.png', { type: 'image/png' });
    }
    const jpg = await canvasToBlob(canvas, 'image/jpeg', 0.9);
    if (jpg && jpg.size <= MAX_UPLOAD_BYTES) return new File([jpg], baseName + '.jpg', { type: 'image/jpeg' });
  }
  throw new Error('Could not make the photo small enough to send.');
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!chosenFile) {
    setStatus('Please add a photo first.', true);
    return;
  }
  if (location.protocol === 'file:') {
    setStatus('Sending only works on the live site, not when the page is opened as a file.', true);
    return;
  }
  submitBtn.disabled = true;
  setStatus('Sending your picture...');
  try {
    const data = new FormData(form);
    data.set('photo', await fitForUpload(chosenFile));
    const res = await fetch('/', { method: 'POST', body: data });
    if (!res.ok) throw new Error('Upload failed with status ' + res.status);
    form.reset();
    chosenFile = null;
    emptyView.hidden = false;
    previewView.hidden = true;
    setStatus("Thanks! We've got your picture.");
  } catch (err) {
    console.warn(err);
    setStatus('Sorry, that did not send. Please try again in a moment.', true);
  } finally {
    submitBtn.disabled = false;
  }
});
