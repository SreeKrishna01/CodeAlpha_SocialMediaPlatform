const fs = require('fs');
const b = fs.readFileSync(process.argv[2]);
function u32(o) { return b.readUInt32BE(o); }
function walk(o, end, depth) {
  while (o + 8 <= end) {
    const size = u32(o);
    if (size < 8 || o + size > end) break;
    const type = b.toString('ascii', o + 4, o + 8);
    if (type === 'stsd') {
      const count = u32(o + 12);
      let p = o + 16;
      for (let i = 0; i < count && p + 8 <= o + size; i++) {
        const sz = u32(p);
        console.log('  '.repeat(depth) + 'STSD codec:', b.toString('ascii', p + 4, p + 8));
        p += sz;
      }
    } else if (['moov', 'trak', 'mdia', 'minf', 'stbl', 'edts'].includes(type)) {
      walk(o + 8, o + size, depth + 1);
    }
    o += size;
  }
}
let p = 0;
while (p + 8 <= b.length) {
  const size = u32(p);
  if (size < 8) break;
  const type = b.toString('ascii', p + 4, p + 8);
  if (type === 'moov') { walk(p + 8, p + size, 0); break; }
  p += size;
}
console.log('file size', b.length);
