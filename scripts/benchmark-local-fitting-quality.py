#!/usr/bin/env python3
"""Offline Pillow decode + existing JS pixel functions. Not browser/device/fit proof."""
import argparse, hashlib, html, json, math, platform, subprocess, tempfile
from pathlib import Path
from PIL import Image, ImageDraw, __version__ as pillow_version

ROOT=Path(__file__).resolve().parents[1]
def sha(data): return hashlib.sha256(data).hexdigest()
def read_json(path): return json.loads(path.read_text())
def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',default='artifacts/real-photo-quality')
    args=parser.parse_args()
    output=(ROOT/args.output).resolve()
    # Never overwrite photographs, app assets, or benchmark reference inputs.
    if not output.is_relative_to(ROOT/'artifacts'): raise ValueError('Output must be under artifacts/')
    output.mkdir(parents=True,exist_ok=True)
    manifest=read_json(ROOT/'benchmark/local-fitting-real-photo-manifest.json')
    sources={x['id']:x for x in read_json(ROOT/'benchmark/locked-photo-sources.json')}
    pipeline_files=['public/local-garment-warp.js','public/closet-white-matte.js',
      'public/reusable-figure-engine.js','scripts/benchmark-local-fitting-bridge.cjs',
      'scripts/benchmark-local-fitting-quality.py','benchmark/local-fitting-real-photo-manifest.json',
      'benchmark/figure-readiness/asset-evidence.json','benchmark/local-fitting-fidelity.mjs']
    pipeline_hashes={p:sha((ROOT/p).read_bytes()) for p in pipeline_files}
    pipeline_digest=sha(json.dumps(pipeline_hashes,sort_keys=True,separators=(',',':')).encode())
    measurements=[]
    evidence=read_json(ROOT/'benchmark/figure-readiness/asset-evidence.json')
    for asset in evidence['figures']:
        path=ROOT/asset['previewPath']; data=path.read_bytes()
        with Image.open(path) as image: width,height=image.size
        actual={'id':asset['id'],'previewSha256':sha(data),'previewWidth':width,'previewHeight':height,
          'masterPresent':False,'masterSha256':None,'masterWidth':None,'masterHeight':None}
        if asset['masterPath']:
            master=(ROOT/asset['masterPath']).resolve()
            if not master.is_relative_to(ROOT): raise ValueError('Master outside repository')
            if master.is_file():
                with Image.open(master) as image: mw,mh=image.size
                actual.update(masterPresent=True,masterSha256=sha(master.read_bytes()),masterWidth=mw,masterHeight=mh)
        measurements.append(actual)
    records=[]; html_rows=[]
    with tempfile.TemporaryDirectory(prefix='closet-fidelity-') as temp:
        decoded=[]; originals={}
        for entry in manifest['cases']:
            source=sources[entry['id']]; path=ROOT/'benchmark/fixtures'/entry['image']; data=path.read_bytes()
            if sha(data)!=entry['sourceSha256'] or source['sha256']!=entry['sourceSha256']:
                raise ValueError('Fixture hash mismatch: '+entry['id'])
            with Image.open(path) as original:
                original.load(); w,h=original.size; image=original.convert('RGBA')
            scale=min(1,math.sqrt(150000/(w*h)))
            size=(max(24,int(w*scale)),max(24,int(h*scale)))
            image=image.resize(size,Image.Resampling.BILINEAR)
            raw=Path(temp)/(entry['id']+'.rgba'); raw.write_bytes(image.tobytes())
            decoded.append({**entry,'width':size[0],'height':size[1],'rgbaPath':str(raw)})
            originals[entry['id']]={'size':[w,h],'path':path,'decoded':image}
        inputs=Path(temp)/'input.json'; results_path=Path(temp)/'results.json'
        inputs.write_text(json.dumps(decoded))
        subprocess.run(['node',str(ROOT/'scripts/benchmark-local-fitting-bridge.cjs'),str(inputs),str(results_path),str(ROOT)],check=True)
        pixel_results=read_json(results_path)
        for entry,pixels in zip(manifest['cases'],pixel_results,strict=True):
            if entry['id']!=pixels['id']: raise ValueError('Case order mismatch')
            case=output/entry['id']; case.mkdir(exist_ok=True)
            original=originals[entry['id']]
            with Image.open(original['path']) as full:
                thumbnail=full.convert('RGB'); thumbnail.thumbnail((512,512));thumbnail.save(case/'source.png')
                # High-resolution source crops for visual comparison, not annotations or ground truth.
                w,h=full.size
                for label,box in [('upper',(0,0,w,int(h*.4))),('middle',(0,int(h*.3),w,int(h*.75))),
                                  ('lower',(0,int(h*.65),w,h))]:
                    crop=full.crop(box).convert('RGB');crop.thumbnail((700,500));crop.save(case/(label+'-detail.png'))
            low=original['decoded']; mask=Image.frombytes('RGBA',low.size,Path(pixels['maskPath']).read_bytes())
            fitted=Image.frombytes('RGBA',(pixels['fittedWidth'],pixels['fittedHeight']),Path(pixels['warpedPath']).read_bytes())
            mask.save(case/'mask-diagnostic.png');fitted.save(case/'warp-diagnostic.png')
            composite_hashes={}
            for figure,rect in pixels['placements'].items():
                # Offline reproduction of PR #33's fill-box layout, NOT browser rendering or PR #34.
                base=Image.open(ROOT/'public/ai-models'/(figure+'-preview.webp')).convert('RGBA').resize((324,600),Image.Resampling.BILINEAR)
                fw,fh=base.size
                layer=fitted.resize((max(1,round(fw*rect['width']/100)),max(1,round(fh*rect['height']/100))),Image.Resampling.BILINEAR)
                base.alpha_composite(layer,(round(fw*rect['left']/100),round(fh*rect['top']/100)))
                draw=ImageDraw.Draw(base);draw.rectangle((0,0,324,34),fill='white')
                draw.text((5,5),'REJECTED / UNREVIEWED DIAGNOSTIC',fill='black')
                target=case/(figure+'-diagnostic.png');base.save(target);composite_hashes[figure]=sha(target.read_bytes())
            attribution=sources[entry['id']]['attribution']
            record={key:value for key,value in pixels.items() if key not in ['maskPath','warpedPath']}
            record.update(sourceSha256=entry['sourceSha256'],originalDimensions=original['size'],
                decodedDimensions=list(low.size),pipelineSha256=pipeline_digest,attribution=attribution,
                visibleFeatures=entry['visibleFeatures'],sourceInspection=entry['sourceInspection'],
                independentReferenceMask=None,featureScores={key:None for key in
                  ['collars','sleeves','seams','logos','colors','transparency','fabricDetail','layering']},
                sourceBytesUnchanged=sha(original['path'].read_bytes())==entry['sourceSha256'],
                candidateFileSha256=sha((case/'warp-diagnostic.png').read_bytes()),compositeFileSha256=composite_hashes,compositeMode='offline-PR33-fill-box-diagnostic-not-browser-or-PR34',
                review=None,artifactChanges='decoded/resized/white-matte-diagnostic/mesh/figure-composite; source untouched')
            if not record['sourceBytesUnchanged']: raise ValueError('Original mutated')
            records.append(record)
            escaped=html.escape
            images=''.join('<figure><img src="'+entry['id']+'/'+f+'"><figcaption>'+label+'</figcaption></figure>'
                for f,label in [('source.png','Source thumbnail'),('mask-diagnostic.png','Mask diagnostic'),
                 ('warp-diagnostic.png','Warp diagnostic'),('female-diagnostic.png','Female diagnostic'),('male-diagnostic.png','Male diagnostic')])
            links=' · '.join('<a href="'+entry['id']+'/'+name+'-detail.png">'+name+' source detail</a>' for name in ['upper','middle','lower'])
            html_rows.append('<section><h2>'+escaped(entry['id'])+' — HOLD</h2><p>'+escaped(entry['sourceInspection'])+'</p><p>Pixel gate: '+escaped(pixels['reason'])+
                '; candidate eligible: '+str(pixels['eligible'])+'. Independent fidelity: UNSCORED.</p><div class="strip">'+images+'</div><p>'+links+'</p><p>Visible features: '+
                escaped(', '.join(entry['visibleFeatures']))+'</p><p>'+escaped(attribution['title'])+' · '+escaped(attribution.get('author',''))+' · '+escaped(attribution.get('credit',''))+' · '+
                '<a href="'+escaped(attribution['source'],quote=True)+'">Source</a> · '+escaped(attribution['license'])+
                (' · <a href="'+escaped(attribution['licenseUrl'],quote=True)+'">License</a>' if attribution.get('licenseUrl') else '')+
                '. Changes: resized/matted/warped research derivatives; no endorsement.</p></section>')
    # Pass documentary evidence to the independently testable Node gates.
    assessment_input=output/'assessment-input.json';assessment_input.write_text(json.dumps({'evidence':evidence,'measurements':measurements}))
    command="import fs from 'node:fs';import {evaluateFigures} from './benchmark/local-fitting-fidelity.mjs';const x=JSON.parse(fs.readFileSync(process.argv[1]));console.log(JSON.stringify(evaluateFigures(x.evidence,x.measurements)));"
    readiness=json.loads(subprocess.check_output(['node','--input-type=module','-e',command,str(assessment_input)],cwd=ROOT,text=True))
    assessment_input.unlink()
    report={'schemaVersion':1,'pipelineSha256':pipeline_digest,'pipelineFiles':pipeline_hashes,
       'decoder':{'engine':'Pillow','version':pillow_version,'python':platform.python_version(),'resize':'BILINEAR','maxDecodeCopyPixels':150000,
                  'browserPixelEquivalenceVerified':False},
       'summary':{'realPhotosScreened':len(records),'pixelGateEligible':sum(x['eligible'] for x in records),
          'heldForIndependentReview':len(records),'independentlyApprovedComposites':0,'fidelityPercent':None,
          'actualPhoneRuns':0,'browserRunsInThisBenchmark':0},'figureReadiness':readiness,'cases':records}
    (output/'results.json').write_text(json.dumps(report,indent=2)+'\n')
    html_doc='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Closet Current real-photo diagnostics</title>
<style>body{font:16px system-ui;background:#faf9f6;color:#222;max-width:1600px;margin:24px auto;padding:0 16px}section{background:white;padding:20px;margin:24px 0;border:1px solid #ccc}.strip{display:flex;flex-wrap:wrap;gap:12px}figure{margin:0;max-width:260px}img{max-width:240px;max-height:440px;background:repeating-conic-gradient(#ddd 0% 25%,#fff 0% 50%) 50%/16px 16px}figcaption{font-weight:bold}a{color:#194db5}</style>
<h1>Real-photo fidelity: unreviewed diagnostics</h1><p>Every composite below is HOLD. Pixel-gate acceptance is not visual approval. No independent garment-only references or comparative fidelity scores exist. Source detail links enable inspection of collars, sleeves, seams, logos, color, transparency and fabric; layering requires separate reviewed multi-garment composites. Offline Pillow/PR #33 fill-box diagnostics do not test browser rendering, PR #34 integration, realistic drape or phones.</p>'''+''.join(html_rows)+'</html>'
    (output/'index.html').write_text(html_doc)
    templates=[]
    for record in records:
        for figure,composite_hash in record['compositeFileSha256'].items():
            templates.append({'id':record['id'],'figure':figure,'sourceSha256':record['sourceSha256'],
              'candidateSha256':record['candidateFileSha256'],'pipelineSha256':pipeline_digest,
              'compositeSha256':composite_hash,'mode':'independent-original-cutout-composite-comparison',
              'reviewer':None,'approvedBy':None,'reviewedAt':None,'comparedOriginal':None,
              'comparedCutout':None,'comparedComposite':None,'checks':{key:None for key in record['featureScores']},
              'bodyOrBackgroundContamination':None,'inventedDetails':None})
    (output/'review-template.json').write_text(json.dumps(templates,indent=2)+'\n')
    print(json.dumps(report['summary'],sort_keys=True))
if __name__=='__main__': main()
