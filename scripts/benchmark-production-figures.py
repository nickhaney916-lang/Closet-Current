#!/usr/bin/env python3
"""Local decoding/integrity packet for exactly two reusable figures; no AI/network."""
import hashlib,html,json,subprocess
from pathlib import Path
from PIL import Image,ImageOps,__version__ as pillow_version
ROOT=Path(__file__).resolve().parents[1]
def sha(b):return hashlib.sha256(b).hexdigest()
def inspect(path):
 data=path.read_bytes()
 with Image.open(path) as im:
  im.verify()
 with Image.open(path) as im:
  if im.width*im.height>20000000:raise ValueError('Oversized decoded image')
  im.load();rgba=im.convert('RGBA');alpha=rgba.getchannel('A');hist=alpha.histogram()
  return {'sha256':sha(data),'bytes':len(data),'format':im.format,'mode':im.mode,'width':im.width,'height':im.height,
   'frames':getattr(im,'n_frames',1),'orientation':im.getexif().get(274,1),
   'iccProfilePresent':bool(im.info.get('icc_profile')),'srgbNormalized':False,
   'lossless':im.format=='PNG','decodedRgbaSha256':sha(rgba.tobytes()),'alphaMin':min(alpha.getdata()),'alphaMax':max(alpha.getdata()),
   'transparentPixels':hist[0],'softAlphaPixels':sum(hist[1:255]),
   'note':'No ICC profile is not evidence of sRGB; native detail, anatomy and rights cannot be inferred from pixels.'}
def local_path(p):
 path=(ROOT/p).resolve()
 if not path.is_relative_to(ROOT):raise ValueError('Asset must be within checkout')
 return path

def main():
 evidence=json.loads((ROOT/'benchmark/figure-readiness/production-evidence.json').read_text());rows=[]
 for asset in evidence['figures']:
  preview=inspect(local_path(asset['previewPath']))
  if preview['sha256']!=asset['previewSha256']:raise ValueError('Preview bytes changed')
  rows.append({'id':asset['id'],'preview':preview,'master':inspect(local_path(asset['masterPath']))if asset['masterPath']else None})
 out=ROOT/'artifacts/production-figures';out.mkdir(exist_ok=True,parents=True)
 measured={'decoder':'Pillow '+pillow_version,'measurements':rows}
 (out/'decoded.json').write_text(json.dumps(measured,indent=2)+'\n')
 subprocess.run(['node','scripts/report-production-figures.mjs'],cwd=ROOT,check=True)
 # Diagnostic copies only; never stage/upscale these previews into production assets.
 sections=[]
 for asset in evidence['figures']:
  with Image.open(local_path(asset['previewPath']))as im:
   im.convert('RGB').save(out/(asset['id']+'-native.png'))
  sections.append('<section><h2>'+asset['id']+' — BLOCKED</h2><img src="'+asset['id']+'-native.png" alt="Current '+asset['id']+' preview"><p>160 × 297 preview. No native-detail, anatomy, pose, release or commercial-rights approval.</p></section>')
 (out/'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>Two-figure readiness</title><style>body{font:16px system-ui;margin:24px}section{display:inline-block;padding:16px;border:1px solid #bbb;vertical-align:top}img{width:270px;height:auto}</style><h1>Current figure diagnostics — not production approved</h1><p>Same two files. Enlarging these previews cannot create native detail. No customer images, generated art, external inference or asset substitutions.</p>'+''.join(sections)+'</html>')
if __name__=='__main__':main()
