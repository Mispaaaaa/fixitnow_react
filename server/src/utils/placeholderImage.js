import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Tiny dependency-free PNG writer used only by the seed script for demo images.
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

/**
 * Writes a simple branded placeholder PNG (gradient + soft shapes) so seeded
 * photos and verification documents render without shipping binary fixtures.
 */
export function writePlaceholderPng(filePath, { width = 800, height = 600, from, to, seed = 0 } = {}) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const start = hexToRgb(from || '#0f766e');
  const end = hexToRgb(to || '#f59e0b');
  const raw = Buffer.alloc((width * 3 + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const offset = y * (width * 3 + 1);
    raw[offset] = 0;
    for (let x = 0; x < width; x += 1) {
      const t = (x / width + y / height) / 2;
      const stripe = ((x + y + seed * 40) % 160 < 3 ? 18 : 0) + ((x * 2 + y) % 90 < 2 ? 12 : 0);
      const index = offset + 1 + x * 3;
      raw[index] = Math.min(255, Math.round(start[0] * (1 - t) + end[0] * t) + stripe);
      raw[index + 1] = Math.min(255, Math.round(start[1] * (1 - t) + end[1] * t) + stripe);
      raw[index + 2] = Math.min(255, Math.round(start[2] * (1 - t) + end[2] * t) + stripe);
    }
  }

  // A few translucent-looking circles keep the demo images from looking blank.
  for (let i = 0; i < 7; i += 1) {
    const cx = (seed * 97 + i * 173) % width;
    const cy = (seed * 53 + i * 211) % height;
    const radius = 42 + (i % 3) * 28;
    for (let y = Math.max(0, cy - radius); y < Math.min(height, cy + radius); y += 1) {
      for (let x = Math.max(0, cx - radius); x < Math.min(width, cx + radius); x += 1) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > radius ** 2) continue;
        const index = y * (width * 3 + 1) + 1 + x * 3;
        raw[index] = Math.min(255, raw[index] + 28);
        raw[index + 1] = Math.min(255, raw[index + 1] + 28);
        raw[index + 2] = Math.min(255, raw[index + 2] + 28);
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(filePath, png);
  return png.length;
}