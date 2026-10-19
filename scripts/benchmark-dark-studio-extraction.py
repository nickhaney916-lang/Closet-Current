#!/usr/bin/env python3
"""Licensed-photo extraction diagnostics only; partial witnesses are not full-mask truth."""
import argparse,hashlib,html,json,math,subprocess,tempfile
from pathlib import Path
from PIL import Image,ImageDraw,__version__ as pillow_version
ROOT=Path(__file__).resolve().parents[1]
def sha(b):return hashlib.sha256(b).hexdigest()
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',default='artifacts/dark-studio-extraction');args=p.parse_args()
 out=(ROOT/args.output).resolve()
 if not out.is_relative_to(ROOT/'artifacts'):raise ValueError('Output must be inside artifacts/')
 out.mkdir(exist_ok=True,parents=True)
 manifest=json.loads((ROOT/'benchmark/local-fitting-real-photo-manifest.json').read_text())
 sources={x['id']:x for x in json.loads((ROOT/'benchmark/locked-photo-sources.json').read_text())}
 pipelines=['public/dark-studio-garment-mask.js','public/local-garment-warp.js','public/closet-white-matte.js',
  'scripts/benchmark-dark-studio-extraction.py','scripts/measure-dark-studio-extraction.cjs',
  'benchmark/local-fitting-real-photo-manifest.json','benchmark/dark-studio-source-witnesses.json']
 hashes={f:sha((ROOT/f).read_bytes())for f in pipelines}
 sections=[]
 with tempfile.TemporaryDirectory(prefix='closet-dark-studio-')as tmp:
  rows=[];images={}
  for row in manifest['cases']:
   path=ROOT/'benchmark/fixtures'/row['image'];bytes_=path.read_bytes()
   if sha(bytes_)!=row['sourceSha256']or sources[row['id']]['sha256']!=row['sourceSha256']:raise ValueError('Source mismatch')
   with Image.open(path)as im:
    im=im.convert('RGBA');w,h=im.size;scale=min(1,math.sqrt(150000/(w*h)))
    low=im.resize((int(w*scale),int(h*scale)),Image.Resampling.BILINEAR)
    images[row['id']]=im
   raw=Path(tmp)/(row['id']+'.rgba');raw.write_bytes(low.tobytes())
   rows.append({**row,'width':low.width,'height':low.height,'rgbaPath':str(raw)})
  input_=Path(tmp)/'inputs.json';results=Path(tmp)/'results.json';input_.write_text(json.dumps(rows))
  subprocess.run(['node','scripts/measure-dark-studio-extraction.cjs',str(input_),str(results)],cwd=ROOT,check=True)
  records=json.loads(results.read_text())
  for row,record in zip(rows,records,strict=True):
   directory=out/row['id'];directory.mkdir(exist_ok=True)
   image=images[row['id']];image.thumbnail((600,900));image.save(directory/'source.png')
   attribution=sources[row['id']]['attribution'];record['attribution']=attribution
   record['originalFileUnchanged']=sha((ROOT/'benchmark/fixtures'/row['image']).read_bytes())==row['sourceSha256']
   shown='<img src="'+row['id']+'/source.png" alt="Original source thumbnail">'
   if record['proposalAvailable']:
    candidate=Image.frombytes('RGBA',(row['width'],row['height']),Path(row['rgbaPath']+'.candidate').read_bytes())
    candidate.save(directory/'candidate.png')
    b=record['bounds'];fitted=Image.frombytes('RGBA',(b['width'],b['height']),Path(row['rgbaPath']+'.warp').read_bytes());fitted.save(directory/'mesh-diagnostic.png')
    checker=Image.new('RGB',candidate.size,'white');draw=ImageDraw.Draw(checker)
    for y in range(0,candidate.height,12):
     for x in range(0,candidate.width,12):
      if (x//12+y//12)%2:draw.rectangle((x,y,x+11,y+11),fill='#b7c0ce')
    checker.paste(candidate,mask=candidate.getchannel('A'));checker.save(directory/'checkerboard.png')
    shown+='<img src="'+row['id']+'/checkerboard.png" alt="Unreviewed automatic mask on checkerboard"><img src="'+row['id']+'/mesh-diagnostic.png" alt="Unreviewed mesh diagnostic">'
   sections.append('<section><h2>'+row['id']+'</h2><p>Automatic proposal: '+str(record['proposalAvailable'])+'; automatic display: HOLD. '+html.escape(record['reason'])+'</p>'+shown+
    '<p>'+html.escape(row['sourceInspection'])+'</p><p>'+html.escape(attribution['title'])+' · '+html.escape(attribution.get('author',''))+' · '+html.escape(attribution.get('credit',''))+
    ' · <a href="'+html.escape(attribution['source'],quote=True)+'">Source</a> · '+html.escape(attribution['license'])+
    (' · <a href="'+html.escape(attribution['licenseUrl'],quote=True)+'">License</a>'if attribution.get('licenseUrl')else'')+
    '. Derivatives: resized, original RGB with proposed alpha, mesh diagnostic; no endorsement.</p></section>')
 report={'schemaVersion':1,'baselineRuntimeCommit':'9943f7e232cc793a06df4100b3ebaa139dfee2cd','decoder':'Pillow '+pillow_version,
  'pipelineFiles':hashes,'summary':{'realPhotos':len(records),'automaticProposals':sum(r['proposalAvailable']for r in records),
   'approvedAutomaticDisplay':0,'independentlyScoredFullMasks':0,'realPhoneRuns':0},'cases':records}
 (out/'results.json').write_text(json.dumps(report,indent=2)+'\n')
 (out/'index.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><title>Dark-studio extraction diagnostics</title><style>body{font:16px system-ui;margin:24px;background:#faf9f6}section{padding:16px;border:1px solid #aaa;margin:20px 0}img{max-height:520px;max-width:32%;vertical-align:top;background:#ddd}</style><h1>Real-photo extraction proposals — held for review</h1><p>Source colors/logos are not regenerated. Partial assistant-inspected source patches are diagnostic witnesses, not independent full-mask truth. No safe automatic display, realistic drape or physical-phone claim.</p>'+''.join(sections)+'</html>')
 print(json.dumps(report['summary']))
if __name__=='__main__':main()
