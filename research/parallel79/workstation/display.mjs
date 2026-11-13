/** Non-authoritative LOCAL display only. Never writes or replaces original bytes.
 * Remove orientation metadata from a copy before explicit EXIF transform, avoiding
 * inconsistent PNG/JPEG/WebP auto-orientation across browser engines. */
export function stripOrientationMetadata(input, mime) {
  const b = new Uint8Array(input),
    view = new DataView(b.buffer, b.byteOffset, b.byteLength),
    parts = [];
  const ascii = (at, n) => String.fromCharCode(...b.subarray(at, at + n));
  if (mime === "image/png") {
    if (b.length < 8) throw Error("Truncated PNG");
    parts.push(b.subarray(0, 8));
    let at = 8,
      ended = false;
    while (at + 12 <= b.length) {
      const n = view.getUint32(at),
        end = at + 12 + n;
      if (end > b.length) throw Error("Truncated PNG chunk");
      const type = ascii(at + 4, 4);
      if (type !== "eXIf") parts.push(b.subarray(at, end));
      at = end;
      if (type === "IEND") {
        ended = true;
        break;
      }
    }
    if (!ended || at !== b.length) throw Error("Invalid PNG framing");
  } else if (mime === "image/jpeg") {
    if (b[0] !== 255 || b[1] !== 216) throw Error("Invalid JPEG");
    parts.push(b.subarray(0, 2));
    let at = 2,
      scan = false;
    while (at < b.length) {
      const start = at;
      if (b[at++] !== 255) throw Error("Invalid JPEG marker");
      while (b[at] === 255) at++;
      const marker = b[at++];
      if (marker === 0xda) {
        parts.push(b.subarray(start));
        scan = true;
        break;
      }
      if (marker === 0xd9) throw Error("JPEG missing scan");
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        parts.push(b.subarray(start, at));
        continue;
      }
      if (at + 2 > b.length) throw Error("Truncated JPEG");
      const n = view.getUint16(at),
        end = at + n;
      if (n < 2 || end > b.length) throw Error("Truncated JPEG segment");
      if (marker !== 0xe1) parts.push(b.subarray(start, end));
      at = end;
    }
    if (!scan) throw Error("JPEG missing scan");
  } else if (mime === "image/webp") {
    if (
      ascii(0, 4) !== "RIFF" ||
      ascii(8, 4) !== "WEBP" ||
      view.getUint32(4, true) + 8 !== b.length
    )
      throw Error("Invalid WebP");
    parts.push(b.slice(0, 12));
    let at = 12;
    while (at + 8 <= b.length) {
      const n = view.getUint32(at + 4, true),
        end = at + 8 + n + (n % 2);
      if (end > b.length) throw Error("Truncated WebP");
      const type = ascii(at, 4);
      if (type !== "EXIF") {
        const part = b.slice(at, end);
        if (type === "VP8X") part[8] &= ~8;
        parts.push(part);
      }
      at = end;
    }
    if (at !== b.length) throw Error("Invalid WebP framing");
  } else throw Error("Unsupported MIME");
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  if (mime === "image/webp")
    new DataView(out.buffer).setUint32(4, out.length - 8, true);
  return out;
}
export function orientationTransform(o, w, h) {
  const matrices = {
    1: [1, 0, 0, 1, 0, 0],
    2: [-1, 0, 0, 1, w, 0],
    3: [-1, 0, 0, -1, w, h],
    4: [1, 0, 0, -1, 0, h],
    5: [0, 1, 1, 0, 0, 0],
    6: [0, 1, -1, 0, h, 0],
    7: [0, -1, -1, 0, h, w],
    8: [0, -1, 1, 0, 0, w],
  };
  if (!matrices[o]) throw Error("Invalid EXIF orientation");
  return matrices[o];
}
export async function uprightDisplay(bytes, photo) {
  const copy = stripOrientationMetadata(bytes, photo.mime),
    url = URL.createObjectURL(new Blob([copy], { type: photo.mime }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (
      image.naturalWidth !== photo.width ||
      image.naturalHeight !== photo.height
    )
      throw Error("Raw decoded dimensions mismatch");
    const canvas = document.createElement("canvas"),
      swap = photo.orientation >= 5;
    canvas.width = swap ? photo.height : photo.width;
    canvas.height = swap ? photo.width : photo.height;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(
      ...orientationTransform(photo.orientation, photo.width, photo.height),
    );
    ctx.drawImage(image, 0, 0);
    const blob = await new Promise((ok, bad) =>
      canvas.toBlob(
        (b) => (b ? ok(b) : bad(Error("Display pixels unavailable"))),
        "image/png",
      ),
    );
    canvas.width = canvas.height = 0;
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
