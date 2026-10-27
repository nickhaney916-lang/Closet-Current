"""Offline, human-guided full-frame alpha outline; always provisional.

Run only on an explicitly bound local JPEG. Polygon is manually traced; no
segmentation or assurance that pixels inside are all fabric. EXIF-transposed
RGB is kept byte-for-byte in decoded output. No source file is overwritten.
"""
import argparse, hashlib, json
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

def build(source, metadata, output):
    raw = source.read_bytes()
    if hashlib.sha256(raw).hexdigest() != metadata['source_sha256']:
        raise ValueError('source hash mismatch')
    image = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    width, height = image.size
    if width * height > 8_000_000 or width < 1 or height < 1:
        raise ValueError('unsupported dimensions')
    points = metadata['polygon']
    if not 3 <= len(points) <= 200 or any(len(p) != 2 or any(not isinstance(v, (int, float)) or not 0 <= v <= 1 for v in p) for p in points):
        raise ValueError('invalid outline')
    mask = Image.new('L', image.size, 0)
    ImageDraw.Draw(mask).polygon([(round(x*(width-1)),round(y*(height-1))) for x,y in points], fill=255)
    rgba = image.convert('RGBA'); rgba.putalpha(mask)
    if source.resolve() == output.resolve() or output.exists():
        raise ValueError('refusing to overwrite')
    rgba.save(output, format='PNG')
    return {'source_sha256':metadata['source_sha256'],'width':width,'height':height,'status':'PROVISIONAL — visual review required','method':'manual polygon, no automatic approval','visible_pixels':sum(mask.histogram()[1:]), 'output_sha256':hashlib.sha256(output.read_bytes()).hexdigest()}

if __name__ == '__main__':
    p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('metadata',type=Path);p.add_argument('output',type=Path);args=p.parse_args()
    print(json.dumps(build(args.source,json.loads(args.metadata.read_text()),args.output),indent=2))
