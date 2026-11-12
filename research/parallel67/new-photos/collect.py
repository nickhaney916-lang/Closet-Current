#!/usr/bin/env python3
"""New public publisher-described development photos. NOT human ground truth.
Collect original JPEGs, excluding all existing benchmark source/title/hash strings.
No model calls. All proposed labels require independent human acceptance review.
"""
import concurrent.futures, hashlib, json, re, urllib.parse, urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'research/parallel67/new-photos'; IMAGES=ROOT/'benchmark/parallel67-photos'
UA='ClosetCurrentParallel67Research/1.0 (https://github.com/nickhaney916-lang/Closet-Current/issues/892)'
def get(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}), timeout=40) as r:return r.read()
def clean(s):return re.sub(r'\s+', ' ', re.sub('<[^>]+>', ' ', str(s))).strip()
def canon(s):return urllib.parse.unquote(str(s)).split('?')[0].replace('_',' ').lower()
def strings(x):
    if isinstance(x,str):yield x
    elif isinstance(x,dict):
        for v in x.values():yield from strings(v)
    elif isinstance(x,list):
        for v in x:yield from strings(v)
existing=set()
for p in (ROOT/'benchmark').glob('*.json'):
    for s in strings(json.loads(p.read_text())):existing.add(canon(s))
queries=[('Tops','T-shirt','intitle:"t-shirt"'),('Tops','Sweatshirt','intitle:sweatshirt'),('Tops','Blouse','intitle:blouse'),('Tops','Tunic','intitle:tunic'),('Shoes','Sneakers','intitle:sneakers'),('Shoes','Ankle boots','intitle:"ankle boots"'),('Dresses','Dress','intitle:dress'),('Uncategorized','Unknown','intitle:"empty room"')]
rows=[]; seen=set(); failures=[]
for category,subtype,query in queries:
    params=dict(action='query',generator='search',gsrsearch=query+' filetype:bitmap',gsrnamespace='6',gsrlimit='25',prop='imageinfo',iiprop='url|extmetadata|mime|size',format='json')
    try: pages=json.loads(get('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params))).get('query',{}).get('pages',{})
    except Exception as e: failures.append({'query':query,'reason':str(e)}); continue
    candidates=[]
    for p in pages.values():
        i=p.get('imageinfo',[{}])[0]; m=i.get('extmetadata',{}); title=p['title']; url=i.get('url',''); license=clean(m.get('LicenseShortName',{}).get('value','')); desc=clean(m.get('ImageDescription',{}).get('value',''))
        if i.get('mime')!='image/jpeg' or i.get('size',0)>12*1024*1024 or i.get('size',0)<10000:continue
        if not re.search(r'^(CC0|CC BY|Public domain|PD)',license,re.I):continue
        if 'NC' in license or 'ND' in license:continue
        if any(canon(s) in existing for s in [title,url,i.get('descriptionurl','')]):continue
        if canon(url) in seen:continue
        # Explicit publisher/title descriptions support proposed subtype only.
        if subtype=='T-shirt' and not re.search(r't[- ]shirt',title,re.I):continue
        if subtype=='Sweatshirt' and not re.search(r'sweatshirt',title,re.I):continue
        if subtype=='Blouse' and not re.search(r'blouse',title,re.I):continue
        if subtype=='Tunic' and not re.search(r'tunic',title,re.I):continue
        if subtype=='Sneakers' and not re.search(r'sneakers',title,re.I):continue
        if subtype=='Ankle boots' and not re.search(r'ankle.boots',title,re.I):continue
        if subtype=='Dress' and not re.search(r'\bdress\b',title,re.I):continue
        # Exclude clearly irrelevant title contexts, displays, illustrations, multiple items.
        if re.search(r'(drawing|painting|portrait|engraving|illustration|doll|logo|dress rehearsal|fancy dress|cross.dress|dress code|Dress of|army|military|uniform|single\.jpg|album|vinyl|steely|museum display|collection of|costume party)',title,re.I):continue
        candidates.append((p,i,m,license,desc))
    kept=0
    for p,i,m,license,desc in candidates:
        if kept>=4:break
        try:
            original=i['url'].split('?')[0]; content=get(original)
            sha=hashlib.sha256(content).hexdigest()
            if sha in existing or sha in seen:continue
            if not content.startswith(b'\xff\xd8'):continue
            number=len(rows)+1; id=f'p67-new-{number:04d}'; filename=id+'.jpg'
            (IMAGES/filename).write_bytes(content)
            rows.append(dict(id=id,image=filename,sha256=sha,bytes=len(content),width=i.get('width'),height=i.get('height'),source=i.get('descriptionurl'),originalUrl=original,title=p['title'],publisherDescription=desc,license=license,licenseUrl=clean(m.get('LicenseUrl',{}).get('value','')),author=clean(m.get('Artist',{}).get('value','')),credit=clean(m.get('Credit',{}).get('value','')),proposedCategory=category,proposedType=subtype,expectedColor=None,labelEvidence='explicit publisher filename/description; NOT independent human ground truth',verified=False,split='new-publisher-labeled-development-candidate',modelExposed=False))
            seen.add(canon(original));seen.add(sha);kept+=1
            print(id,subtype,p['title'],flush=True)
        except Exception as e:failures.append({'title':p['title'],'reason':str(e)})
    print('query complete',subtype,kept,flush=True)
result={'schema':'closet-current-parallel67-new-public-candidates/v1','notBlindAcceptance':True,'notHumanGroundTruth':True,'noModelInferenceAtCollection':True,'priorBenchmarkExclusion':'all string values in benchmark/*.json, canonicalized URL/title and SHA','rows':rows,'failures':failures}
(OUT/'manifest.json').write_text(json.dumps(result,indent=2)+'\n')
(OUT/'manifest.sha256').write_text(hashlib.sha256((OUT/'manifest.json').read_bytes()).hexdigest()+'  manifest.json\n')
print('TOTAL',len(rows))
