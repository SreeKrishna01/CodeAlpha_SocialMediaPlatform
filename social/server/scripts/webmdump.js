const fs = require('fs');

function vint(data, pos) {
  const first = data[pos];
  if (first === undefined) return null;
  let len = 1;
  let mask = 0x7f;
  for (let i = 0; i < 8; i++) {
    if (first & (0x80 >> i)) { len = i + 1; mask = 0x7f >> i; break; }
  }
  let value = first & mask;
  for (let i = 1; i < len; i++) value = value * 256 + data[pos + i];
  return { len, value };
}

function idLen(first) {
  for (let i = 0; i < 8; i++) {
    if (first & (0x80 >> i)) return i + 1;
  }
  return 8;
}

function readId(data, pos) {
  const len = idLen(data[pos]);
  let value = 0;
  for (let i = 0; i < len; i++) value = value * 256 + data[pos + i];
  return { id: value, len, next: pos + len };
}

function walk(data, start, end, depth, cb, budget) {
  let o = start;
  let steps = 0;
  while (o < end && steps < budget) {
    steps++;
    const idr = readId(data, o);
    if (idr.next >= end) break;
    const sr = vint(data, idr.next);
    if (!sr || sr.len <= 0) break;
    let payloadStart = idr.next + sr.len;
    let payloadSize = sr.value;
    if (payloadSize === 0x7fffffffffffffff) payloadSize = end - payloadStart;
    if (payloadStart + payloadSize > end) payloadSize = end - payloadStart;
    if (payloadSize < 0) break;
    cb(idr.id, payloadStart, payloadSize, depth, idr.next + sr.len - o);
    if (payloadSize > 0) o = payloadStart + payloadSize;
    else o = idr.next + sr.len;
    if (o <= idr.next) break;
  }
}

const b = fs.readFileSync(process.argv[2] || 'media/posts/test.webm');
const dump = [];
const CONTAINERS = new Set([
  0x18538067, 0x1549a966, 0x1654ae6b, 0x114d9b74, 0x1f43b675, 0x1043a770, 0x1077, 0x1f43b675,
]);
function scan(start, end, depth) {
  walk(b, start, end, depth, (id, s, size, d) => {
    dump.push(`${'  '.repeat(d)}id=${id.toString(16)} @${s} size=${size}`);
    if (CONTAINERS.has(id) && d < 4 && size < 100000000) {
      scan(s, s + size, d + 1);
    }
  }, 200000);
}
scan(0, b.length, 0);
console.log(dump.slice(0, 60).join('\n'));
console.log('--- total lines:', dump.length);
