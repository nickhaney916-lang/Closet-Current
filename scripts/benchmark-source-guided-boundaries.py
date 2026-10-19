#!/usr/bin/env python3
"""Compare internally derived mask projection and source-guided boundary proposal."""
import argparse,hashlib,html,json,math,subprocess,tempfile
from pathlib import Path
from PIL import Image,ImageDraw,__version__ as pillow_version
ROOT=Path(__file__).resolve().parents[1]
def sha(b):return hashlib.sha256(b).hexdigest()
def checker(image):
 out=Image.new('RGB',image.size,'white');d=ImageDraw.Draw(out)
 for y in range(0,image.height,16):
  for x in range(0,image.width,16):
   if(x//16+y//16)%2:d.rectangle((x,y,x+15,y+15),fill='#b7c0ce')
 out.paste(image,mask=image.getchannel('A'));return out

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',default='artifacts/source-guided-boundaries');args=parser.parse_args()
 output=(ROOT/args.output).resolve()
 if not output.is_relative_to(ROOT/'artifacts'):raise ValueError('Output must be under artifacts/')
 output.mkdir(exist_ok=True,parents=True)
 rows_=json.loads((ROOT/'benchmark/local-fitting-real-photo-manifest.json').read_text())['cases']
 sources={r['id']:r for r in json.loads((ROOT/'benchmark/locked-photo-sources.json').read_text())}
 hashes={p:sha((ROOT/p).read_bytes())for p in ['public/dark-studio-garment-mask.js','public/source-guided-mask-refinement.js',
  'public/local-garment-warp.js','scripts/measure-source-guided-boundaries.cjs','scripts/benchmark-source-guided-boundaries.py',
  'benchmark/local-fitting-real-photo-manifest.json','benchmark/dark-studio-source-witnesses.json']}
 sections=[]
 with tempfile.TemporaryDirectory(prefix='closet-boundaries-')as tmp:
  inputs=[];originals={}
  for row in rows_:
   path=ROOT/'benchmark/fixtures'/row['image'];source=path.read_bytes()
   if sha(source)!=row['sourceSha256']or sources[row['id']]['sha256']!=row['sourceSha256']:raise ValueError('Source mismatch')
   with Image.open(path)as im:
    rgb=im.convert('RGBA');originals[row['id']]=rgb.copy();w,h=rgb.size;s=min(1,math.sqrt(600000/(w*h)))
    rgb=rgb.resize((math.floor(w*s),math.floor(h*s)),Image.Resampling.BILINEAR)
   raw=Path(tmp)/(row['id']+'.rgba');raw.write_bytes(rgb.tobytes());inputs.append({**row,'width':rgb.width,'height':rgb.height,'rgbaPath':str(raw)})
  input_path=Path(tmp)/'inputs.json';result_path=Path(tmp)/'results.json';input_path.write_text(json.dumps(inputs))
  subprocess.run(['node','scripts/measure-source-guided-boundaries.cjs',str(input_path),str(result_path)],cwd=ROOT,check=True)
  records=json.loads(result_path.read_text())
  for row,record in zip(inputs,records,strict=True):
   case=output/row['id'];case.mkdir(exist_ok=True)
   record['sourceFileUnchanged']=sha((ROOT/'benchmark/fixtures'/row['image']).read_bytes())==row['sourceSha256']
   record['attribution']=sources[row['id']]['attribution'];original=originals[row['id']];original.thumbnail((600,900));original.save(case/'source.png')
   tags='<figure><img src="'+row['id']+'/source.png"><figcaption>Original thumbnail</figcaption></figure>'
   if record['proposalAvailable']:
    previews={}
    for kind in ['projection','candidate','uncertainty','warp']:
     size=(row['width'],row['height'])if kind!='warp'else(record['bounds']['width'],record['bounds']['height'])
     im=Image.frombytes('RGBA',size,Path(row['rgbaPath']+'.'+kind).read_bytes());im.save(case/(kind+'.png'))
     view=checker(im)if kind!='uncertainty'else im.convert('RGB');view.save(case/(kind+'-view.png'));previews[kind]=view
     tags+='<figure><img src="'+row['id']+'/'+kind+'-view.png"><figcaption>'+kind+' — UNREVIEWED</figcaption></figure>'
    for region in record['boundaryRegions']:
     l,t,r,b=region['box'];w,h=previews['projection'].size
     crops=[previews[kind].crop((int(l*w),int(t*h),math.ceil(r*w),math.ceil(b*h)))for kind in ['projection','candidate']]
     comparison=Image.new('RGB',(crops[0].width*2,crops[0].height),'white')
     comparison.paste(crops[0],(0,0));comparison.paste(crops[1],(crops[0].width,0));comparison.resize((comparison.width*2,comparison.height*2),Image.Resampling.NEAREST).save(case/(region['name']+'-comparison.png'))
     tags+='<a href="'+row['id']+'/'+region['name']+'-comparison.png">'+region['name']+' projection / refinement</a> · '
   a=record['attribution'];sections.append('<section><h2>'+row['id']+' — HOLD</h2><p>Proposal '+str(record['proposalAvailable'])+'; '+html.escape(record['reason'])+'</p><div>'+tags+'</div><p>'+html.escape(a['title'])+' · '+html.escape(a.get('author',''))+' · '+html.escape(a.get('credit',''))+' · <a href="'+html.escape(a['source'],quote=True)+'">Source</a> · '+html.escape(a['license'])+(' · <a href="'+html.escape(a['licenseUrl'],quote=True)+'">License</a>'if a.get('licenseUrl')else'')+'. Changes: resized, proposed alpha, diagnostic warp/overlay; no endorsement.</p></section>')
 report={'schemaVersion':1,'baselineCommit':'8d009ec056f8b7178185efb422beb94cd085a07c','decoder':'Pillow '+pillow_version,'comparisonMode':'same-higher-resolution-source-grid internal guide projection versus refinement; not pixel-identical PR39 A/B',
  'pipelineFiles':hashes,'summary':{'realPhotos':len(records),'automaticProposals':sum(x['proposalAvailable']for x in records),
  'newDisplayApprovals':0,'independentlyScoredFullMasks':0,'realPhoneRuns':0},'cases':records}
 (output/'results.json').write_text(json.dumps(report,indent=2)+'\n')
 (output/'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>Source-guided boundaries</title><style>body{font:16px system-ui;margin:24px}section{border:1px solid #bbb;padding:18px;margin:20px 0}figure{display:inline-block;margin:6px;max-width:28%;vertical-align:top}img{max-width:100%;max-height:520px}</style><h1>Source-guided boundary proposals — held for review</h1><p>Compare the internally derived guide projected to the same larger source grid with the refined candidate. Orange marks uncertainty, not errors or approved labels. Changes and partial witnesses do not establish complete mask correctness. No RGB editing, independent full-mask score, automatic display approval or real-phone evidence.</p>'+''.join(sections)+'</html>')
 print(json.dumps(report['summary']))
if __name__=='__main__':main()
