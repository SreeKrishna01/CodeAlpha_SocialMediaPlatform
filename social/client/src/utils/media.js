const MAX_VIDEO_SECONDS = 120;
const MAX_RAW_VIDEO_BYTES = 220 * 1024 * 1024;

export function isVideoDataUrl(data) {
  return typeof data === 'string' && data.startsWith('data:video/');
}

export function isVideoFile(file) {
  return (
    file.type.startsWith('video/') ||
    /\.(mp4|webm|mov|m4v|mkv|avi|ogv|3gp)$/i.test(file.name)
  );
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read this file.'));
    reader.readAsDataURL(blob);
  });
}

function probeVideo(src) {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () =>
      resolve({
        ok: true,
        duration: v.duration || 0,
        width: v.videoWidth || 0,
        height: v.videoHeight || 0,
      });
    v.onerror = () => resolve({ ok: false });
    v.src = src;
  });
}

// Videos are passed through unchanged so the browser's own native file plays
// back (re-encoding here produced WebM files that could not be played).
export async function prepareVideoFile(file, { onProgress } = {}) {
  if (file.size > MAX_RAW_VIDEO_BYTES) {
    throw new Error('Video is too large. Please pick a smaller one.');
  }
  const url = URL.createObjectURL(file);
  const meta = await probeVideo(url);
  if (!meta.ok) {
    URL.revokeObjectURL(url);
    throw new Error('Could not read this video file.');
  }
  if (meta.duration > MAX_VIDEO_SECONDS) {
    URL.revokeObjectURL(url);
    const err = new Error(`Video is longer than ${MAX_VIDEO_SECONDS / 60} minutes. Please pick a shorter one.`);
    err.code = 'TOO_LONG';
    throw err;
  }
  URL.revokeObjectURL(url);
  if (onProgress) onProgress(1);
  return blobToDataUrl(file);
}
