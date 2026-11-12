#!/usr/bin/env python3
"""Collect independently human-annotated source groups; never call a model."""
import concurrent.futures,datetime,hashlib,json,re,urllib.error,urllib.request,zipfile,time
from collections import defaultdict,Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];OUT=Path(__file__).resolve().parent
ANNOTATIONS=Path('/tmp/p68-fashionpedia-val.json');ARCHIVE=Path('/tmp/p68-fashionpedia-val-images.zip')
UA='ClosetCurrentParallel68Research/1.0 (https://github.com/nickhaney916-lang/Closet-Current/issues/909)'
def digest(x):return hashlib.sha256(x).hexdigest()
def get(url):
 for attempt in range(3):
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}),timeout=35) as response:return response.read()
  except urllib.error.HTTPError as e:
   if e.code in (429,403):raise
   if attempt==2:raise
  except (TimeoutError,urllib.error.URLError):
   if attempt==2:raise
  time.sleep(2)
def objects(x):
 if isinstance(x,dict):
  yield x
  for v in x.values():yield from objects(v)
 elif isinstance(x,list):
  for v in x:yield from objects(v)
def norm(url):return url.rstrip('/').lower()
for url,path,expected in [
 ('https://s3.amazonaws.com/ifashionist-dataset/annotations/instances_attributes_val2020.json',ANNOTATIONS,'f831f415edad12d52acde8b138fe7ebd1592b57bf0dcd6a3b63ba8cabd208223'),
 ('https://s3.amazonaws.com/ifashionist-dataset/images/val_test2020.zip',ARCHIVE,'44eb1685364b6ed6bda4595fe0dc07a252e9b923112b97b24ff4d440751a2acc')]:
 if not path.exists():
  request=urllib.request.Request(url,headers={'User-Agent':UA})
  with urllib.request.urlopen(request,timeout=60) as response,path.open('wb') as target:
   while block:=response.read(1024*1024):target.write(block)
 if digest(path.read_bytes())!=expected:raise ValueError('Official dataset source changed')
data=json.loads(ANNOTATIONS.read_bytes());images={x['id']:x for x in data['images']};licenses={x['id']:x for x in data['licenses']};annotations=defaultdict(list)
for a in data['annotations']:
 if a['category_id']<=26:annotations[a['image_id']].append(a)
dev=json.loads((ROOT/'research/parallel67-reference/fashionpedia/manifest.json').read_text());dev_ids={x['imageId'] for x in dev['rows']};dev_authors={norm(x['photoLicenseReceipt']['creator']['url']) for x in dev['rows']}
candidates=sorted(i['id'] for i in data['images'] if i['license'] in (0,1) and i['id'] not in dev_ids and annotations[i['id']] and all(isinstance(a['segmentation'],list) for a in annotations[i['id']]))
def screen(image_id):
 i=images[image_id];match=re.search(r'/([0-9]+)_[a-z0-9]+',i['original_url'])
 if not match:return {'imageId':image_id,'excluded':True,'reason':'No auditable Flickr photo identity'}
 url='https://www.flickr.com/photo.gne?id='+match.group(1)
 try:raw=get(url)
 except Exception as e:return {'imageId':image_id,'excluded':True,'reason':'Primary source unavailable: '+type(e).__name__,'primaryPage':url}
 items=[]
 for body in re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',raw.decode('utf-8'),re.S|re.I):
  try:items.extend(objects(json.loads(body)))
  except json.JSONDecodeError:pass
 expected=licenses[i['license']]['url'];items=[x for x in items if x.get('@type')=='ImageObject' and x.get('license')==expected and isinstance(x.get('author'),dict) and x['author'].get('name') and x['author'].get('url')]
 if len(items)!=1:return {'imageId':image_id,'excluded':True,'reason':'No unique matching current creator/license','primaryPage':url,'primaryPageSha256':digest(raw)}
 x=items[0];author=norm(x['author']['url'])
 return {'imageId':image_id,'excluded':author in dev_authors,'reason':'Photographer already used in development' if author in dev_authors else None,'datasetLicense':licenses[i['license']],'primaryPage':url,'primaryPageSha256':digest(raw),'primaryPhotoPage':x.get('acquireLicensePage') or url,'creator':x['author'],'creatorIdentity':author,'primaryLicenseUrl':x['license'],'primaryContentUrl':x.get('contentUrl'),'checkedAtUtc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
OUT.mkdir(parents=True,exist_ok=True);cache=OUT/'license-screening.json';existing={x['imageId']:x for x in json.loads(cache.read_text())} if cache.exists() else {}
missing=[i for i in candidates if i not in existing]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for receipt in pool.map(screen,missing):
  existing[receipt['imageId']]=receipt;cache.write_text(json.dumps(sorted(existing.values(),key=lambda x:x['imageId']),indent=2)+'\n')
  if len(existing)%20==0:print('screened',len(existing),flush=True)
accepted=[x for x in existing.values() if not x['excluded']]
groups=defaultdict(list)
for x in accepted:groups[x['creatorIdentity']].append(x['imageId'])
print('GROUPS',json.dumps({k:sorted(v) for k,v in groups.items()},indent=2),flush=True)
print('accepted',len(accepted),'authors',len(groups),'screened',len(existing),flush=True)
