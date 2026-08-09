const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

const MEDIA_ROOT = path.join(__dirname, '..', 'media');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'video/x-matroska': 'mkv',
  'video/3gpp': '3gp',
  'video/ogg': 'ogv',
  'video/mpeg': 'mpg',
};

function extFromDataUrl(dataUrl) {
  const m = /^data:([^;,]+)/.exec(dataUrl || '');
  const mime = m ? m[1].toLowerCase() : null;

  if (!mime) return null;

  if (EXT_BY_MIME[mime]) return EXT_BY_MIME[mime];
  if (mime.startsWith('video/')) return 'mp4';
  if (mime.startsWith('image/')) return 'jpg';

  return null;
}

function isDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:');
}

async function saveDataUrl(dataUrl, subdir = 'posts') {
  const ext = extFromDataUrl(dataUrl);

  if (!ext) {
    throw new Error('Unsupported media type');
  }

  try {
    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: `kek-start/${subdir}`,
      resource_type: 'auto',
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload media');
  }
}

async function saveDataUrls(urls = [], subdir = 'posts') {
  const out = [];

  for (const u of urls) {
    if (isDataUrl(u)) {
      out.push(await saveDataUrl(u, subdir));
    } else {
      out.push(u);
    }
  }

  return out;
}

function removeFiles(urls) {
  // Cloudinary files are not deleted here.
  // Existing local media files are still handled if needed.

  const list = Array.isArray(urls) ? urls : urls ? [urls] : [];

  for (const u of list) {
    if (typeof u !== 'string' || !u.startsWith('/media/')) continue;

    const full = path.resolve(
      MEDIA_ROOT,
      u.replace('/media/', '')
    );

    if (!full.startsWith(MEDIA_ROOT + path.sep)) continue;

    fs.unlink(full, () => {});
  }
}

module.exports = {
  saveDataUrl,
  saveDataUrls,
  removeFiles,
  isDataUrl,
  MEDIA_ROOT,
};
