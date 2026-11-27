const $ = (selector) => document.querySelector(selector);
let busy = false;
let objectUrl = null;
const GALLERY_DB = 'wine-ai-gallery';
const GALLERY_STORE = 'images';

function openGallery() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(GALLERY_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(GALLERY_STORE)) {
        request.result.createObjectStore(GALLERY_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('تعذر فتح معرض الصور'));
  });
}

async function saveToGallery(blob, name = 'WINE STUDIO creation') {
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('تعذر تجهيز الصورة للحفظ'));
    reader.readAsDataURL(blob);
  });
  const db = await openGallery();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(GALLERY_STORE, 'readwrite');
    transaction.objectStore(GALLERY_STORE).add({ name, data, createdAt: Date.now() });
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error('تعذر حفظ الصورة في المعرض'));
    transaction.onabort = () => reject(transaction.error || new Error('تم إلغاء حفظ الصورة'));
  });
  db.close();
}

async function createGuestToken() {
  const stored = localStorage.getItem('wine_token') || '';
  if (stored) return stored;
  const name = (localStorage.getItem('wine_name') || 'زائر').trim().slice(0, 30) || 'زائر';
  const response = await fetch('/api/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.token) throw new Error(data.error || 'تعذر بدء جلسة المستخدم');
  localStorage.setItem('wine_token', data.token);
  localStorage.setItem('wine_name', data.name || name);
  localStorage.setItem('wine_guest', '1');
  return data.token;
}

async function getImage(prompt) {
  let token = await createGuestToken();
  let response = await fetch('/api/star-x-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Token': 'Bearer ' + token },
    body: JSON.stringify({ prompt })
  });
  if (response.status === 401) {
    localStorage.removeItem('wine_token');
    token = await createGuestToken();
    response = await fetch('/api/star-x-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Token': 'Bearer ' + token },
      body: JSON.stringify({ prompt })
    });
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'تعذر توليد الصورة');
  }
  const blob = await response.blob();
  if (!blob.type.startsWith('image/') || !blob.size) throw new Error('لم تصل صورة صالحة من خدمة التوليد');
  return blob;
}

function addWatermark(source) {
  return new Promise(async (resolve, reject) => {
    try {
      const bitmap = await createImageBitmap(source);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('المتصفح لا يدعم تجهيز الصورة');
      context.drawImage(bitmap, 0, 0);
      const scale = Math.max(1, Math.min(canvas.width, canvas.height) / 900);
      const fontSize = Math.max(11, Math.round(13 * scale));
      const padding = Math.round(12 * scale);
      const label = 'WINE STUDIO AI © 2026 WINE Organization';
      context.save();
      context.font = '600 ' + fontSize + 'px Manrope, Arial, sans-serif';
      context.textAlign = 'right';
      context.textBaseline = 'bottom';
      const width = context.measureText(label).width + padding * 1.5;
      const height = fontSize + padding;
      const x = canvas.width - padding;
      const y = canvas.height - padding;
      context.fillStyle = 'rgba(8,10,16,.38)';
      context.fillRect(x - width, y - height, width, height);
      context.fillStyle = 'rgba(255,255,255,.68)';
      context.fillText(label, x - padding * .65, y - padding * .45);
      context.restore();
      bitmap.close();
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('تعذر تجهيز نسخة الصورة')), 'image/png');
    } catch (error) {
      reject(error);
    }
  });
}

function showError(message) {
  const result = $('#result');
  result.replaceChildren();
  const box = document.createElement('div');
  box.className = 'error';
  box.textContent = message;
  result.append(box);
}

function renderImage(blob, prompt) {
  const result = $('#result');
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(blob);
  result.replaceChildren();

  const card = document.createElement('div');
  card.className = 'image-card';
  const image = document.createElement('img');
  image.src = objectUrl;
  image.alt = 'الصورة التي أنشأها WINE STUDIO';
  image.loading = 'eager';

  const actions = document.createElement('div');
  actions.className = 'image-actions';
  const download = document.createElement('a');
  download.href = objectUrl;
  download.download = 'wine-studio-creation.png';
  download.className = 'primary';
  download.textContent = '↓ تحميل الصورة';

  const save = document.createElement('button');
  save.type = 'button';
  save.textContent = 'حفظ في المعرض';
  save.addEventListener('click', async () => {
    save.disabled = true;
    save.textContent = 'جارٍ الحفظ...';
    try {
      await saveToGallery(blob, 'WINE STUDIO · ' + prompt.slice(0, 70));
      $('#saveState').textContent = 'تم حفظ الصورة في معرض الإبداعات على هذا الجهاز.';
      save.textContent = 'تم الحفظ ✓';
    } catch (error) {
      $('#saveState').textContent = error.message || 'تعذر حفظ الصورة. تحقق من مساحة التخزين.';
      save.disabled = false;
      save.textContent = 'إعادة المحاولة';
    }
  });

  const state = document.createElement('div');
  state.className = 'save-state';
  state.id = 'saveState';
  state.textContent = 'الصورة جاهزة. يمكنك تحميلها أو حفظها في معرض الإبداعات.';
  actions.append(download, save);
  card.append(image, actions, state);
  result.append(card);
}

async function generate() {
  const promptField = $('#prompt');
  const button = $('#generate');
  const result = $('#result');
  const rawPrompt = promptField.value.trim();
  if (!rawPrompt) {
    showError('اكتب وصف الصورة أولاً، أو اختر أحد الاقتراحات السريعة.');
    promptField.focus();
    return;
  }
  if (rawPrompt.length > 4000) {
    showError('وصف الصورة أطول من الحد المسموح (4000 حرف).');
    return;
  }
  if (busy) return;

  const style = $('#style').value;
  const ratio = $('#ratio').value;
  const prompt = [rawPrompt, style, ratio].filter(Boolean).join(', ');
  busy = true;
  button.disabled = true;
  button.textContent = 'جارٍ إنشاء الصورة...';
  result.innerHTML = '<div class="loading"><span class="spinner"></span><b>WINE STUDIO يعمل على صورتك</b><br>قد يستغرق ذلك بعض الوقت.</div>';

  try {
    const source = await getImage(prompt);
    let finalImage = source;
    try {
      finalImage = await addWatermark(source);
    } catch (watermarkError) {
      console.warn('[WINE STUDIO] watermark skipped:', watermarkError);
    }
    renderImage(finalImage, rawPrompt);
    try {
      await saveToGallery(finalImage, 'WINE STUDIO · ' + rawPrompt.slice(0, 70));
      const state = $('#saveState');
      if (state) state.textContent = 'تم حفظ الصورة تلقائياً في معرض الإبداعات على هذا الجهاز.';
      const saveButton = document.querySelector('.image-actions button');
      if (saveButton) {
        saveButton.textContent = 'تم الحفظ ✓';
        saveButton.disabled = true;
      }
    } catch (saveError) {
      const state = $('#saveState');
      if (state) state.textContent = 'الصورة جاهزة، لكن تعذر حفظ نسخة تلقائية في المعرض: ' + (saveError.message || 'خطأ تخزين');
    }
  } catch (error) {
    showError(error.message || 'حدث خطأ غير متوقع أثناء إنشاء الصورة.');
  } finally {
    busy = false;
    button.disabled = false;
    button.textContent = '✦ إنشاء الصورة';
  }
}

$('#generate').addEventListener('click', generate);
$('#prompt').addEventListener('input', () => {
  $('#counter').textContent = $('#prompt').value.length + ' / 4000';
});
$('#prompt').addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') generate();
});
document.querySelectorAll('[data-prompt]').forEach((button) => {
  button.addEventListener('click', () => {
    $('#prompt').value = button.dataset.prompt || '';
    $('#counter').textContent = $('#prompt').value.length + ' / 4000';
    $('#prompt').focus();
    document.querySelectorAll('[data-prompt]').forEach((chip) => chip.classList.toggle('active', chip === button));
  });
});
window.addEventListener('beforeunload', () => {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});
