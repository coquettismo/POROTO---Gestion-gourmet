// Generate valid standalone PNG files for PWA icons
import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 2; // Color type: Truecolor (RGB)
  ihdrData[10] = 0; // Compression method
  ihdrData[11] = 0; // Filter method
  ihdrData[12] = 0; // Interlace method

  function createChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    // CRC calculation
    let crc = 0xffffffff;
    for (let i = 4; i < 8 + len; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        if ((crc ^ byte) & 1) {
          crc = (crc >>> 1) ^ 0xedb88320;
        } else {
          crc = crc >>> 1;
        }
        byte = byte >>> 1;
      }
    }
    buf.writeInt32BE(~crc, 8 + len);
    return buf;
  }

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data: for each row, 1 filter byte (0) + width * 3 bytes (R, G, B)
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // None filter
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      // Add a nice terracotta gradient / vignette
      const dx = (x - width / 2) / (width / 2);
      const dy = (y - height / 2) / (height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const factor = Math.max(0.4, 1 - dist * 0.45);

      rawData[pxOffset] = Math.min(255, Math.floor(r * factor));
      rawData[pxOffset + 1] = Math.min(255, Math.floor(g * factor));
      rawData[pxOffset + 2] = Math.min(255, Math.floor(b * factor));
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Terracotta / artisan bronze warm color: #ea580c (234, 88, 12)
fs.writeFileSync('public/pwa-192x192.png', createPng(192, 192, 234, 88, 12));
fs.writeFileSync('public/pwa-512x512.png', createPng(512, 512, 234, 88, 12));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPng(512, 512, 194, 65, 12));
fs.writeFileSync('public/apple-touch-icon.png', createPng(180, 180, 234, 88, 12));

console.log('Valid PWA PNGs generated successfully.');
