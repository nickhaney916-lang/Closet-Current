#!/usr/bin/env python3
"""Measure actual locally rendered candidate files, never approve their appearance."""
import hashlib,json,html,math,base64,io,os
from pathlib import Path
from PIL import Image,ImageCms,ImageDraw,__version__ as pillow_version
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts/figure-creation';NATIVE=OUT/'native'
def sha(b):return hashlib.sha256(b).hexdigest()
def checker(im):
 bg=Image.new('RGBA',im.size,'white');d=ImageDraw.Draw(bg)
 for y in range(0,im.height,24):
  for x in range(0,im.width,24):
   if(x//24+y//24)%2:d.rectangle((x,y,x+23,y+23),fill='#b9c1cc')
 bg.alpha_composite(im);return bg.convert('RGB')
def save_atomic(im,path,**options):
 data=io.BytesIO();im.save(data,format='WEBP'if path.suffix=='.webp'else'PNG',**options)
 tmp=path.with_name(path.name+'.partial');raw=data.getvalue()
 with open(tmp,'wb')as f:f.write(raw);f.flush();os.fsync(f.fileno())
 os.replace(tmp,path)
 if sha(path.read_bytes())!=sha(raw):raise ValueError('Incomplete output write')
def inspect(path):
 b=path.read_bytes()
 with Image.open(path)as im:im.verify()
 with Image.open(path)as im:
  im.load();a=im.getchannel('A');bbox=a.getbbox();hist=a.histogram()
  return {'sha256':sha(b),'bytes':len(b),'width':im.width,'height':im.height,'mode':im.mode,'frames':getattr(im,'n_frames',1),
   'decodedRgbaSha256':sha(im.tobytes()),'iccProfilePresent':bool(im.info.get('icc_profile')),'alphaBounds':list(bbox),
   'borderClear':not any(a.crop(box).getbbox()for box in [(0,0,im.width,1),(0,im.height-1,im.width,im.height),(0,0,1,im.height),(im.width-1,0,im.width,im.height)]),
   'transparentPixels':hist[0],'softAlphaPixels':sum(hist[1:255]),'opaquePixels':hist[255],
   'normalizedBodyBounds':[bbox[0]/im.width,bbox[1]/im.height,bbox[2]/im.width,bbox[3]/im.height]}
def main():
 records=json.loads((NATIVE/'render-records.json').read_text());recipe=json.loads((ROOT/'benchmark/figure-creation/recipe.json').read_text())
 for field,path in [('recipeSha256','benchmark/figure-creation/recipe.json'),('sourceLockSha256','benchmark/figure-creation/source-lock.json'),('scriptSha256','scripts/create-local-figures.py')]:
  if records[field]!=sha((ROOT/path).read_bytes()):raise ValueError('Stale render pipeline: '+field)
 if records['quickDiagnostic']or records['blenderVersion']!='4.3.0':raise ValueError('Requires pinned native final renders')
 if [r['id']for r in records['figures']]!=['female','male']:raise ValueError('Exactly two figures')
 delivery=OUT/'delivery';delivery.mkdir(exist_ok=True);profile=json.loads((ROOT/'benchmark/figure-creation/srgb-profile.json').read_text());icc=base64.b64decode(profile['base64']);
 if sha(icc)!=profile['sha256']:raise ValueError('sRGB profile changed')
 rows=[];sections=[]
 for r in records['figures']:
  kind=r['id'];native=NATIVE/(kind+'-master.png')
  if sha(native.read_bytes())!=r['pngSha256']or sha((NATIVE/(kind+'.blend')).read_bytes())!=r['sceneSha256']:raise ValueError('Native scene or PNG altered')
  with Image.open(native)as im:
   im.load()
   if im.size!=(1941,3597)or im.mode!='RGBA':raise ValueError('Native master must be 1941x3597 RGBA')
   save_atomic(im,delivery/(kind+'-master.png'),icc_profile=icc)
   save_atomic(im.resize((1294,2398),Image.Resampling.LANCZOS),delivery/(kind+'-1294.png'),icc_profile=icc)
   save_atomic(im.resize((970,1798),Image.Resampling.LANCZOS),delivery/(kind+'-mobile.webp'),lossless=True,icc_profile=icc)
   thumb=im.copy();thumb.thumbnail((350,650));checker(thumb).save(OUT/(kind+'-review.png'))
  variants={name:inspect(delivery/(kind+suffix))for name,suffix in [('master','-master.png'),('minimum','-1294.png'),('mobile','-mobile.webp')]}
  if not all(v['borderClear']for v in variants.values()):raise ValueError('Figure clipped at image border')
  rows.append({**r,'nativeSceneRenderEvidence':'Pinned Blender scene + script/source/recipe/output hashes; not authenticated visual approval','variants':variants})
  sections.append('<section><h2>'+kind+' — candidate, not approved</h2><img src="'+kind+'-review.png" alt="New local '+kind+' candidate"><p>Native 1941×3597 scene render; simplified procedural materials, clothing and hair. No photorealism or commercial-product approval.</p></section>')
 a,b=rows;names=list(a['projectedSourceJoints']);deltas={name:{axis:abs(a['projectedSourceJoints'][name][axis]-b['projectedSourceJoints'][name][axis])for axis in ['x','y']}for name in names}
 files=['scripts/figure_fabric_boundaries.py','scripts/create-local-figures.py','scripts/benchmark-created-figures.py','benchmark/figure-creation/recipe.json','benchmark/figure-creation/source-lock.json','scripts/prepare-local-figure-tools.py','benchmark/figure-creation/srgb-profile.json']
 report={'schemaVersion':1,'status':'two-created-candidates-held-for-review','blenderVersion':records['blenderVersion'],'blenderBuildHash':records['blenderBuildHash'],
  'decoder':'Pillow '+pillow_version,'pipelineFiles':{p:sha((ROOT/p).read_bytes())for p in files},'sourceRevision':a['sourceRevision'],
  'summary':{'fixedCharacters':2,'native1941x3597Renders':2,'minimum1294x2398Derivatives':2,'productionApproved':0,'independentVisualApprovals':0,'physicalPhones':0,'customerImagesUsed':0,'externalInferenceCalls':0},
  'pairDiagnostics':{'projectedSourceJointDeltas':deltas,'maxCoordinateDelta':max(d[axis]for d in deltas.values()for axis in ['x','y']),
   'headAndSoleNormalization':'Both scene body heights 1.75m at the same camera, not actual equal anatomy','independentlyReviewedAnatomy':False,'runtimePlacementChanged':False},
  'blockers':['simplified synthetic skin/eyes/hair not photorealistic','front upper rim and lower hem have bounded native 3D smoothing, but cuffs, collar topology and clothing realism require independent visual review','new rounded procedural footwear remains visually and anatomically unapproved','hands, face and proportions need independent full-size review','source-joint projections are not approved chin/waist/body landmarks','commercial product and optional face-replacement use not approved','physical-phone performance and visual quality untested'],
  'upstreamRightsEvidence':'Pinned CC0 headers/metadata plus LICENSE.md and LICENSE.ASSETS.md; no exclusive ownership or warranty; final product approval remains separate',
  'figures':rows}
 (OUT/'results.json').write_text(json.dumps(report,indent=2)+'\n')
 (OUT/'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>Local figure creation review</title><style>body{font:16px system-ui;margin:24px}section{display:inline-block;padding:16px;vertical-align:top;border:1px solid #bbb}img{max-width:350px}</style><h1>Two newly rendered figure candidates — held</h1><p>These are local 3D renders using pinned CC0 source assets, not upscaled old previews. High resolution does not establish photorealism, anatomy or product licensing approval.</p>'+''.join(sections)+'</html>')
 print(json.dumps(report['summary']));print('Maximum projected source-joint coordinate delta:',report['pairDiagnostics']['maxCoordinateDelta'])
if __name__=='__main__':main()
