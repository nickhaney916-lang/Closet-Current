"""Render actual public photos, human polygons and model masks for inspection."""
import base64,gzip,hashlib,html,io,json
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from pycocotools import mask as coco_mask

ROOT=Path(__file__).resolve().parents[1]
D=ROOT/'research/parallel67-reference'
OUT=ROOT.parent/'parallel67-reference-delivery';OUT.mkdir(exist_ok=True)
manifest=json.loads((D/'fashionpedia/manifest.json').read_text())
comparison=json.loads((D/'results/human-mask-comparison.json').read_text())
baseline={r['id']:r for r in json.loads((D/'results/segformer-fashionpedia.json').read_text())['rows']}
reference={r['id']:r for r in json.loads((D/'results/reference-fashionpedia.json').read_text())['rows']}
colors=[(0,155,190),(245,130,30),(165,70,205),(0,155,85),(225,60,100),(120,130,10),(30,90,220)]
font_path='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def font(size):
    try:return ImageFont.truetype(font_path,size)
    except OSError:return ImageFont.load_default()

def preview(source,mode):
    path=ROOT/'benchmark/parallel67-reference-photos'/source['image'];data=path.read_bytes()
    if hashlib.sha256(data).hexdigest()!=source['sha256']:raise ValueError('Source changed')
    image=Image.open(io.BytesIO(data)).convert('RGB');overlay=Image.new('RGBA',image.size);masks=[];labels=[]
    if mode=='human':
        names={c['id']:c['name'] for c in manifest['categories']}
        for ann in source['annotations']:
            masks.append(coco_mask.decode(coco_mask.merge(coco_mask.frPyObjects(ann['segmentation'],image.height,image.width))).astype(bool));labels.append(names[ann['category_id']])
    elif mode in ('baseline','reference'):
        row=(baseline if mode=='baseline' else reference)[source['id']]
        for region in row['regions']:
            data=gzip.decompress((ROOT/region['maskFile']).read_bytes())
            if hashlib.sha256(data).hexdigest()!=region['maskSha256']:raise ValueError('Model mask changed')
            masks.append(np.frombuffer(data,dtype=np.uint8).reshape(image.height,image.width).astype(bool));labels.append(region['label'])
    for i,(mask,label) in enumerate(zip(masks,labels)):
        rgba=np.zeros((image.height,image.width,4),dtype=np.uint8);rgba[mask]=(*colors[i%len(colors)],96)
        overlay=Image.alpha_composite(overlay,Image.fromarray(rgba))
    image=Image.alpha_composite(image.convert('RGBA'),overlay).convert('RGB')
    image.thumbnail((360,470));canvas=Image.new('RGB',(380,530),'#ffffff');canvas.paste(image,((380-image.width)//2,32+(470-image.height)//2))
    draw=ImageDraw.Draw(canvas);titles={'original':'Original photo','human':'Human annotations','baseline':'Current SegFormer','reference':'Florence + SAM2 reference'}
    draw.text((10,8),titles[mode],font=font(16),fill='#17253b')
    if mode!='original':
        text=f'{len(masks)} regions'
        if mode in ('baseline','reference'):
            row=next(x for x in comparison[mode]['rows'] if x['id']==source['id']);text+=f" • {len(row['classAgnosticMatches'])}/{row['groundTruthInstances']} matched at IoU ≥0.5"
        draw.text((10,505),text,font=font(13),fill='#17253b')
    return canvas

cards=[]
for source in manifest['rows']:
    images={mode:preview(source,mode) for mode in ['original','human','baseline','reference']}
    encoded={}
    for mode,image in images.items():
        b=io.BytesIO();image.save(b,format='PNG');encoded[mode]='data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()
    receipt=source['photoLicenseReceipt'];cards.append({'id':source['id'],'images':encoded,'creator':receipt['creator']['name'],'source':receipt['primaryPhotoPage'],'license':receipt['primaryLicenseUrl'],'regions':[{k:r.get(k) for k in ['label','category','itemType','colorProposal']} for r in reference[source['id']]['regions']]})

def delta(source):
    key=source['id'];b=next(x for x in comparison['baseline']['rows'] if x['id']==key);r=next(x for x in comparison['reference']['rows'] if x['id']==key)
    return len(r['classAgnosticMatches'])-len(b['classAgnosticMatches'])
ranked=sorted(manifest['rows'],key=lambda x:(delta(x),x['id']))
selected=[ranked[-1],ranked[0]]
sheet=Image.new('RGB',(1520,1260),'#eef2f6');draw=ImageDraw.Draw(sheet)
draw.text((22,18),'Closet Current • actual reference-model comparison',font=font(28),fill='#17253b')
draw.text((22,60),'Human-labeled public photos • original masks • review required • no release approval',font=font(16),fill='#435065')
for row,source in enumerate(selected):
    for column,mode in enumerate(['original','human','baseline','reference']):sheet.paste(preview(source,mode),(column*380,100+row*570))
    receipt=source['photoLicenseReceipt'];draw.text((14,635+row*570),source['id']+' • Photo: '+receipt['creator']['name']+' • CC BY 2.0',font=font(14),fill='#17253b')
draw.text((14,1238),'Annotations: Fashionpedia Consortium, CC BY 4.0. Samples show strongest and weakest recall change; aggregate includes all eight photos.',font=font(12),fill='#435065')
sheet.save(OUT/'closet-current-reference-comparison.png')

data=json.dumps(cards).replace('</','<\\/')
stats={name:comparison[name]['classAgnostic'] for name in ['baseline','reference','publishedODPattern']}
page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Closet Current recognition reference</title><style>
body{margin:0;background:#eef2f6;color:#17253b;font:16px system-ui}main{max-width:1550px;margin:auto;padding:24px}h1{margin:0 0 10px}p{max-width:1050px;line-height:1.5}select{padding:12px;font:inherit;max-width:100%}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:20px}img{width:100%;border-radius:8px;background:white}#stats,#proposals{overflow-x:auto;max-width:100%}table{border-collapse:collapse;background:white}td,th{padding:10px 18px;text-align:left;border-bottom:1px solid #ddd}.note{background:#fff4d8;padding:14px;border-radius:8px}a{color:#175a9b}@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:450px){.grid{grid-template-columns:1fr}}
</style><main><h1>See what the recognition models actually found</h1><p>Eight public Fashionpedia validation photos, with 38 independently human-annotated garment instances. The reference follows Grounded SAM 2's detection-to-mask architecture using smaller CPU models. All proposals require review.</p><div id="stats"></div><p class="note">This measures instance separation, not T-shirt-versus-sweatshirt accuracy. The public validation set is small; pretraining overlap is unknown. Color and fine subtypes are unverified. Nothing is merged or deployed.</p><label>Inspect a photo <select id="photo"></select></label><div class="grid" id="images"></div><p id="credit"></p><h2>Reference proposals — every item needs review</h2><div id="proposals"></div><p>Human annotations: Fashionpedia Consortium, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Model overlays are actual outputs; predicted mask quality is not annotation IoU. The reference includes generated-caption grounding; the published OD-only pattern is scored separately above.</p></main><script>
const cards=CARDS,stats=STATS;let s='<table><tr><th>System</th><th>Matched / 38</th><th>Predicted regions</th><th>Recall</th><th>Precision</th></tr>';for(const [k,v] of Object.entries(stats)){s+=`<tr><td>${k==='baseline'?'Current SegFormer':k==='reference'?'Reference + caption grounding':'Published OD pattern'}</td><td>${v.matched} / ${v.groundTruth}</td><td>${v.predicted}</td><td>${(v.recall*100).toFixed(1)}%</td><td>${(v.precision*100).toFixed(1)}%</td></tr>`}document.querySelector('#stats').innerHTML=s+'</table>';
const select=document.querySelector('#photo');cards.forEach((c,i)=>select.add(new Option(c.id,i)));function show(){const c=cards[select.value||0];document.querySelector('#images').replaceChildren(...Object.entries(c.images).map(([mode,src])=>{const img=new Image;img.src=src;img.alt=mode+' actual visualization';return img}));const p=document.querySelector('#credit');p.replaceChildren(document.createTextNode('Photo: '+c.creator+' • '));for(const [label,url] of [['Original source',c.source],['CC BY 2.0',c.license]]){const a=document.createElement('a');a.textContent=label;a.href=url;p.append(a,document.createTextNode(' • '));}const table=document.createElement('table'),head=document.createElement('tr');for(const name of ['Detected description','Category','Subtype','Pixel color (unverified)']){const th=document.createElement('th');th.textContent=name;head.append(th)}table.append(head);for(const region of c.regions){const tr=document.createElement('tr');for(const value of [region.label,region.category,region.itemType,region.colorProposal?.color]){const td=document.createElement('td');td.textContent=value||'Unknown';tr.append(td)}table.append(tr)}document.querySelector('#proposals').replaceChildren(table);}select.onchange=show;show();
</script></html>'''.replace('CARDS',data).replace('STATS',json.dumps(stats))
(OUT/'closet-current-reference-inspector.html').write_text(page)
print(OUT/'closet-current-reference-comparison.png');print(OUT/'closet-current-reference-inspector.html')
