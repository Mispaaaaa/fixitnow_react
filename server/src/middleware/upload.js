import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const IMAGE_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

const DOCUMENT_TYPES = new Map([
  ...IMAGE_TYPES,
  ['application/pdf', '.pdf'],
]);

function makeStorage(subdir) {
  const destination = path.join(env.uploadsDir, 'public', subdir);
  fs.mkdirSync(destination, { recursive: true });
  return multer.diskStorage({
    destination,
    filename(req, file, cb) {
      const ext = IMAGE_TYPES.get(file.mimetype) || '.bin';
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
  });
}

function imageFilter(req, file, cb) {
  if (!IMAGE_TYPES.has(file.mimetype)) {
    return cb(ApiError.badRequest('Only JPG, PNG or WebP images are allowed'));
  }
  return cb(null, true);
}

export function imageUploader(subdir = 'misc') {
  return multer({
    storage: makeStorage(subdir),
    limits: { fileSize: 5 * 1024 * 1024, files: 5 },
    fileFilter: imageFilter,
  });
}

const docDestination = path.join(env.uploadsDir, 'private', 'documents');
fs.mkdirSync(docDestination, { recursive: true });

const docStorage = multer.diskStorage({
  destination: docDestination,
  filename(req, file, cb) {
    const ext = DOCUMENT_TYPES.get(file.mimetype) || '.bin';
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

export const documentUploader = multer({
  storage: docStorage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) {
    if (!DOCUMENT_TYPES.has(file.mimetype)) {
      return cb(ApiError.badRequest('Documents must be JPG, PNG, WebP or PDF'));
    }
    return cb(null, true);
  },
});

/** Public URL for a file stored under uploads/public. */
export function publicFileUrl(relativePath) {
  return `/uploads/${relativePath.split(path.sep).join('/')}`;
}