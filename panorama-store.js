// Shared IndexedDB store for panoramas
// Admin writes, Viewer reads.

const DB_NAME = 'panorama-viewer';
const DB_VERSION = 1;
const STORE = 'panoramas';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function genId() {
  // 8-char base36 id
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

async function savePanorama({ name, blob, thumbBlob }) {
  const db = await openDB();
  const id = genId();
  const record = {
    id,
    name: name || 'Untitled',
    blob,
    thumbBlob,
    createdAt: Date.now(),
    size: blob.size,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add(record);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

async function getPanorama(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function listPanoramas() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const results = (req.result || []).sort((a, b) => b.createdAt - a.createdAt);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

async function deletePanorama(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Build a thumbnail from an image blob (max 400px wide)
async function makeThumbnail(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const maxW = 480;
    const scale = Math.min(1, maxW / img.width);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    return await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.7));
  } finally {
    URL.revokeObjectURL(url);
  }
}

window.PanoramaStore = {
  savePanorama,
  getPanorama,
  listPanoramas,
  deletePanorama,
  makeThumbnail,
};
