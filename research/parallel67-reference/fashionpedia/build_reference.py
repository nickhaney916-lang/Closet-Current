#!/usr/bin/env python3
"""Fixed public validation reference; no model inference and no sealed claims.
Fashionpedia annotations CC BY4; selected image permissions separately checked
against each Flickr primary page's JSON-LD license and creator metadata.
"""
import concurrent.futures, datetime, hashlib, html, json, re, urllib.request, zipfile
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(__file__).resolve().parent
PHOTOS=ROOT/'benchmark/parallel67-reference-photos'
ANNOTATION_URL='https://s3.amazonaws.com/ifashionist-dataset/annotations/instances_attributes_val2020.json'
ZIP_URL='https://s3.amazonaws.com/ifashionist-dataset/images/val_test2020.zip'
CANDIDATE_IDS=[8519,8554,8947,9481,9656,9835,10216,10382,10994,10566,10905,10898,9711,9971,10160,10776,11041]
CANDIDATE_IDS=sorted(CANDIDATE_IDS)
IDS=CANDIDATE_IDS
ANNOTATIONS=Path('/tmp/p67-fashionpedia-val.json')
ZIP=Path('/tmp/p67-fashionpedia-val-images.zip')
UA='ClosetCurrentParallel67Research/1.0 (https://github.com/nickhaney916-lang/Closet-Current/issues/892)'
def get(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}),timeout=45) as response:return response.read()
def digest(data):return hashlib.sha256(data).hexdigest()
def jsonld_objects(value):
    if isinstance(value,dict):
        yield value
        for v in value.values():yield from jsonld_objects(v)
    elif isinstance(value,list):
        for v in value:yield from jsonld_objects(v)
if not ANNOTATIONS.exists():ANNOTATIONS.write_bytes(get(ANNOTATION_URL))
if not ZIP.exists():ZIP.write_bytes(get(ZIP_URL))
data=json.loads(ANNOTATIONS.read_bytes());images={x['id']:x for x in data['images']}; licenses={x['id']:x for x in data['licenses']}
assert all(images[i]['license']==0 for i in IDS)
def receipt(image_id):
    row=images[image_id]
    photo_id=re.search(r'/([0-9]+)_[a-z0-9]+',row['original_url']).group(1)
    page='https://www.flickr.com/photo.gne?id='+photo_id
    raw=get(page);markup=raw.decode('utf-8')
    objects=[]
    for body in re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',markup,re.S|re.I):
        try:objects.extend(jsonld_objects(json.loads(body)))
        except json.JSONDecodeError:pass
    matching=[x for x in objects if x.get('@type')=='ImageObject' and x.get('license')=='https://creativecommons.org/licenses/by/2.0/' and x.get('author',{}).get('name')]
    if len(matching)!=1:return dict(imageId=image_id,excluded=True,reason='Primary page unavailable or no current unique CC BY2 author/license receipt',primaryPage=page,primaryPageSha256=digest(raw))
    x=matching[0]
    return dict(imageId=image_id,datasetLicense=licenses[row['license']],primaryPage=page,primaryPageSha256=digest(raw),primaryPhotoPage=x.get('acquireLicensePage'),creator=x['author'],primaryLicenseUrl=x['license'],primaryContentUrl=x.get('contentUrl'),title=x.get('name'),checkedAtUtc=datetime.datetime.now(datetime.timezone.utc).isoformat(),assertion='Current primary Flickr JSON-LD and official Fashionpedia image metadata agree on CC BY 2.0; annotation license is separate.')
cache_receipts=OUT/'license-selection-receipts.json'
if cache_receipts.exists():
    all_receipts=json.loads(cache_receipts.read_text())
else:
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:all_receipts=list(pool.map(receipt,CANDIDATE_IDS))
all_receipts=sorted(all_receipts,key=lambda r:r['imageId'])
polygon_only=lambda image_id: all(isinstance(a['segmentation'],list) for a in data['annotations'] if a['image_id']==image_id and a['category_id']<=26)
receipts=[r for r in all_receipts if not r.get('excluded') and polygon_only(r['imageId'])][:8]
IDS=[r['imageId'] for r in receipts]
if len(IDS)<6:raise ValueError('Insufficient current permissive image license receipts')
OUT.mkdir(parents=True,exist_ok=True);PHOTOS.mkdir(parents=True,exist_ok=True)
(OUT/'license-selection-receipts.json').write_text(json.dumps(all_receipts,indent=2)+'\n')
zip_bytes=ZIP.read_bytes(); zip_sha=digest(zip_bytes)
rows=[]
with zipfile.ZipFile(ZIP) as archive:
    for image_id,r in zip(IDS,receipts):
        i=images[image_id];member='test/'+i['file_name'];content=archive.read(member)
        filename='fashionpedia-val-'+str(image_id)+'.jpg';path=PHOTOS/filename;path.write_bytes(content)
        with Image.open(path) as im:assert im.size==(i['width'],i['height'])
        annotations=[a for a in data['annotations'] if a['image_id']==image_id and a['category_id']<=26]
        assert annotations and all(isinstance(a['segmentation'],list) for a in annotations)
        rows.append(dict(id='fashionpedia-val-'+str(image_id),imageId=image_id,image=filename,width=i['width'],height=i['height'],sha256=digest(content),bytes=len(content),archiveMember=member,datasetImage=i,photoLicenseReceipt=r,annotations=annotations))
result={'schema':'closet-current-parallel67-human-fashionpedia-val-reference/v1','annotationSource':ANNOTATION_URL,'annotationSourceSha256':digest(ANNOTATIONS.read_bytes()),'annotationAttribution':'Fashionpedia Consortium, Fashionpedia validation 2020 instance segmentation annotations, Creative Commons Attribution 4.0','annotationLicense':'https://creativecommons.org/licenses/by/4.0/','annotationTermsSource':'https://fashionpedia.github.io/home/data_license.html','imageArchiveSource':ZIP_URL,'imageArchiveSha256':zip_sha,'selectionIds':IDS,'selectionRule':'Fixed eight ascending-ID CC BY2 polygon-only multi-garment val examples chosen for dress/top/shirt/bottom/shoe coverage before model inference; current creator/license independently verified on Flickr primary pages. No prediction-driven selection.','split':'official public val2020 reference; NOT sealed novel acceptance','independentHumanAnnotations':True,'pretrainingContamination':'Unknown; public validation may occur in model pretraining. No blind generalization claim.','fineSubtypeTruthAvailable':False,'colorTruthAvailable':False,'categoryScope':'Official categories 0-26 only; human garment parts 27+ excluded from object-instance scope. Each shoe annotation remains its own instance.','categories':[c for c in data['categories'] if c['id']<=26],'rows':rows}
(OUT/'license-selection-receipts.json').write_text(json.dumps(all_receipts,indent=2)+'\n')
(OUT/'manifest.json').write_text(json.dumps(result,indent=2)+'\n')
(OUT/'manifest.sha256').write_text(digest((OUT/'manifest.json').read_bytes())+'  manifest.json\n')
print('FROZEN',len(rows),'human-photo-reference',sum(len(r['annotations']) for r in rows),'instances',digest((OUT/'manifest.json').read_bytes()))
