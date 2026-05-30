// Generates pwa-192x192.png and pwa-512x512.png for the Abalone PWA
const fs = require('fs');
const zlib = require('zlib');

const crcTable = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = -1;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const lenBuf = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createAbaloneIcon(size) {
  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.48;

  // Board hex positions (simplified: 3 white + 3 black marbles on a dark bg)
  const marbles = [];
  const spacing = size * 0.16;
  // White marbles (top area)
  for (let i = -1; i <= 1; i++) marbles.push({ x: cx + i * spacing, y: cy - spacing * 0.8, white: true });
  // Black marbles (bottom area)
  for (let i = -1; i <= 1; i++) marbles.push({ x: cx + i * spacing, y: cy + spacing * 0.8, white: false });

  const marbleR = size * 0.09;

  // Build RGBA pixel buffer
  const pixels = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > outerR) {
        // Transparent outside circle
        pixels[idx] = 0; pixels[idx+1] = 0; pixels[idx+2] = 0; pixels[idx+3] = 0;
        continue;
      }

      // Background: dark blue-gray
      let r = 17, g = 24, b = 39, a = 255;

      // Board cell dots
      const cellR = size * 0.055;
      for (let q = -2; q <= 2; q++) {
        for (let row = -2; row <= 2; row++) {
          if (Math.abs(q + row) > 2) continue;
          const cellX = cx + q * spacing * 0.92 + row * spacing * 0.46;
          const cellY = cy + row * spacing * 0.8;
          const d = Math.sqrt((x - cellX) ** 2 + (y - cellY) ** 2);
          if (d < cellR) { r = 31; g = 41; b = 55; }
        }
      }

      // Marbles
      for (const m of marbles) {
        const d = Math.sqrt((x - m.x) ** 2 + (y - m.y) ** 2);
        if (d < marbleR) {
          if (m.white) { r = 230; g = 230; b = 230; }
          else { r = 30; g = 30; b = 35; }
        }
      }

      pixels[idx] = r; pixels[idx+1] = g; pixels[idx+2] = b; pixels[idx+3] = a;
    }
  }

  // Build PNG raw data (RGBA, filter type 0 per row)
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4;
      row[1 + x * 4]     = pixels[src];
      row[1 + x * 4 + 1] = pixels[src + 1];
      row[1 + x * 4 + 2] = pixels[src + 2];
      row[1 + x * 4 + 3] = pixels[src + 3];
    }
    rows.push(row);
  }
  const raw = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw, { level: 6 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

const publicDir = './public';
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

fs.writeFileSync(`${publicDir}/pwa-192x192.png`, createAbaloneIcon(192));
console.log('✓ pwa-192x192.png');
fs.writeFileSync(`${publicDir}/pwa-512x512.png`, createAbaloneIcon(512));
console.log('✓ pwa-512x512.png');
