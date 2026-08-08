const fs = require('fs');

function vint(data, pos) {
  const first = data[pos];
  if (first === undefined) return null;
  let len = 1, mask = 0x7f;
  for (let i = 0; i < 8; i++) {
    if (first & (0x80 >> i)) { len = i + 1; mask = 0x7f >> i; break; }
  }
  if (len > 8) return null;
  let value = first & mask;
  for (let i = 1; i < len; i++) {
    if (data[pos + i] === undefined) return null;
    value = value * 256 + data[pos + i];
  }
  return { len, value };
}

function readId(data, pos) {
  if (pos >= data.length) return null;
  const first = data[pos];
  for (let i = 0; i < 4; i++) {
    if (first & (0x80 >> i)) {
      if (pos + i + 1 > data.length) return null;
      let id = 0;
      for (let j = 0; j <= i; j++) id = id * 256 + data[pos + j];
      return { len: i + 1, id };
    }
  }
  return null;
}

// find the duration (in ms) by walking the EBML structure by element sizes.
// Handles unknown-size Clusters (delimited by the next Cluster element) and
// reads SimpleBlock/Block absolute timestamps (cluster ts + signed int16).
function findDuration(data) {
  // EBML Header: 0x1A45DFA3
  const ebml = readId(data, 0);
  if (!ebml || ebml.id !== 0x1a45dfa3) throw new Error('No EBML header');
  let p = ebml.len;
  const ebmlSz = vint(data, p);
  if (!ebmlSz) throw new Error('Bad EBML size');
  p += ebmlSz.len;
  const ebmlEnd = p + ebmlSz.value;

  // find Segment (0x18538067) after EBML header
  let seg = -1;
  for (let i = ebmlEnd; i < data.length - 4; i++) {
    const id = readId(data, i);
    if (id && id.len === 4 && id.id === 0x18538067) { seg = i; break; }
  }
  if (seg === -1) throw new Error('No Segment');

  const segSize = vint(data, seg + 4);
  if (!segSize) throw new Error('Bad Segment size');
  let pos = seg + 4 + segSize.len;
  const segEnd = segSize.value === 0x01ffffffffffffff
    ? data.length
    : Math.min(data.length, pos + segSize.value);

  let maxAbsTime = -1;

  // top-level walk: clusters have unknown size -> parse children until next cluster
  while (pos + 1 < segEnd) {
    const id = readId(data, pos);
    if (!id) break;
    if (id.len === 4 && id.id === 0x18538067) break; // nested segment, stop

    if (id.len === 4 && id.id === 0x1f43b675) {
      // Cluster (unknown or known size)
      const csz = vint(data, pos + id.len);
      if (!csz) break;
      let cp = pos + id.len + csz.len;
      let clusterTs = 0;
      const clusterStart = pos;
      // children until next Cluster id or file end
      while (cp + 1 < segEnd) {
        const cid = readId(data, cp);
        if (!cid) break;
        if (cid.len === 4 && cid.id === 0x1f43b675) break; // next cluster
        const sv = vint(data, cp + cid.len);
        if (!sv) break;
        const elemData = cp + cid.len + sv.len;
        if (cid.id === 0xe7 && sv.value <= 8) {
          let t = 0;
          for (let i = 0; i < sv.value; i++) t = t * 256 + data[elemData + i];
          clusterTs = t;
        } else if ((cid.id === 0xa3 || cid.id === 0xa1) && sv.value > 4) {
          // SimpleBlock / Block: track# vint, int16 BE timecode, flags
          const tr = vint(data, elemData);
          if (tr) {
            const tpos = elemData + tr.len;
            const rel = (data[tpos] << 8) | data[tpos + 1];
            const signed = rel & 0x8000 ? rel - 0x10000 : rel;
            const abs = clusterTs + signed;
            if (abs > maxAbsTime) maxAbsTime = abs;
          }
        }
        cp = elemData + sv.value;
      }
      pos = cp;
    } else {
      // known-size top-level element, skip
      const sv = vint(data, pos + id.len);
      if (!sv) break;
      pos = pos + id.len + sv.len + sv.value;
    }
  }

  if (maxAbsTime < 0) throw new Error('No video frames found');
  return maxAbsTime;
}

function fixWebmFile(path, outPath) {
  const orig = fs.readFileSync(path);
  const data = Buffer.from(orig);

  const seg = (() => {
    for (let i = 0; i < data.length - 4; i++) {
      const id = readId(data, i);
      if (id && id.len === 4 && id.id === 0x18538067) return i;
    }
    return -1;
  })();
  if (seg === -1) throw new Error('No Segment');

  const segSizeVint = vint(data, seg + 4);
  if (!segSizeVint) throw new Error('Bad segment size');
  const segSizePos = seg + 4;
  const segDataStart = segSizePos + segSizeVint.len;
  const segEnd = segDataStart + segSizeVint.value;

  const info = findId(data, segDataStart, segEnd, [0x15, 0x49, 0xa9, 0x66]);
  if (info === -1) throw new Error('No Info');
  const infoSizeVint = vint(data, info + 4);
  const infoSizePos = info + 4;
  const infoStart = infoSizePos + infoSizeVint.len;
  const infoEnd = infoStart + infoSizeVint.value;

  const dur = findId(data, infoStart, infoEnd, [0x44, 0x89]);

  const lastFrameMs = findDuration(data);
  const durationMs = lastFrameMs + 100;
  const durationSec = durationMs / 1000;

  const durBytes = Buffer.alloc(4);
  durBytes.writeFloatLE(durationMs, 0);

  let out;
  if (dur !== -1) {
    const durSizeVint = vint(data, dur + 2);
    const payloadPos = dur + 2 + durSizeVint.len;
    if (durSizeVint.len !== 1 || durSizeVint.value !== 4) {
      throw new Error('Unexpected duration size');
    }
    out = Buffer.from(data);
    durBytes.copy(out, payloadPos);
  } else {
    const insert = Buffer.from([0x44, 0x89, 0x84, ...durBytes]);
    out = Buffer.alloc(data.length + insert.length);
    data.copy(out, 0, 0, infoEnd);
    insert.copy(out, infoEnd);
    data.copy(out, infoEnd + insert.length, infoEnd);
    const newInfoSize = infoSizeVint.value + 7;
    const infoSzBuf = Buffer.from([newInfoSize]);
    infoSzBuf.copy(out, infoSizePos);
    const newSegSize = segSizeVint.value + 7;
    const segLen = segSizeVint.len;
    let sb = Buffer.alloc(segLen);
    for (let i = 0; i < segLen; i++) {
      sb[i] = (newSegSize >> (8 * (segLen - 1 - i))) & 0xff;
    }
    sb[0] |= 0x80 >> (segLen - 1);
    sb.copy(out, segSizePos);
  }

  fs.writeFileSync(outPath, out);
  return { durationSec, inserted: dur === -1, size: out.length };
}

function findId(data, start, end, idBytes) {
  outer: for (let i = start; i <= end - idBytes.length; i++) {
    for (let j = 0; j < idBytes.length; j++) {
      if (data[i + j] !== idBytes[j]) continue outer;
    }
    return i;
  }
  return -1;
}

if (require.main === module) {
  const file = process.argv[2];
  const out = process.argv[3] || file;
  const r = fixWebmFile(file, out);
  console.log(JSON.stringify(r));
}

module.exports = { fixWebmFile };
