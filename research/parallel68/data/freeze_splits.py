#!/usr/bin/env python3
"""Freeze source-group-disjoint HUMAN-mask cohorts; never inspect predictions."""
import datetime,hashlib,json,zipfile,io
from PIL import Image
from collections import defaultdict,Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];OUT=Path(__file__).resolve().parent
ANNOTATIONS=Path('/tmp/p68-fashionpedia-val.json');ARCHIVE=Path('/tmp/p68-fashionpedia-val-images.zip')
sha=lambda b:hashlib.sha256(b).hexdigest()
annotation_bytes=ANNOTATIONS.read_bytes();assert sha(annotation_bytes)=='f831f415edad12d52acde8b138fe7ebd1592b57bf0dcd6a3b63ba8cabd208223'
assert sha(ARCHIVE.read_bytes())=='44eb1685364b6ed6bda4595fe0dc07a252e9b923112b97b24ff4d440751a2acc'
data=json.loads(annotation_bytes);images={x['id']:x for x in data['images']};ann=defaultdict(list)
for a in data['annotations']:
 if a['category_id']<=26:ann[a['image_id']].append(a)
dev_path=ROOT/'research/parallel67-reference/fashionpedia/manifest.json';dev=json.loads(dev_path.read_bytes());dev_ids={x['imageId'] for x in dev['rows']};dev_sha={x['sha256'] for x in dev['rows']};dev_authors={x['photoLicenseReceipt']['creator']['url'].rstrip('/').lower() for x in dev['rows']}
receipts=[r for r in json.loads((OUT/'license-screening-frozen.json').read_text()) if not r['excluded']]
groups=defaultdict(list)
for r in receipts:
 assert r['creatorIdentity'] not in dev_authors and r['imageId'] not in dev_ids
 groups[r['creatorIdentity']].append(r)
authors=sorted(groups,key=lambda s:sha(('parallel68-source-split-v1:'+s).encode()))
# Exhaustive count DP: choose whole photographer groups with the most balanced
# available image counts. Truncation never moves an author to another split.
options={0:()}
for author in authors:
 count=len(groups[author])
 for size,subset in list(options.items()):options.setdefault(size+count,subset+(author,))
total=sum(len(v) for v in groups.values());balanced=min((s for s in options if 0<s<total),key=lambda s:(abs(total-2*s),s))
validation_authors=set(options[balanced]);acceptance_authors=set(authors)-validation_authors
count=min(16,balanced,total-balanced)
if count<4:raise ValueError('Insufficient fully photographer-disjoint human sources')
def select(author_set):
 # Round-robin photographers, then original image ID: deterministic diversity,
 # no prediction-, boundary-difficulty- or color-derived selection.
 buckets=[sorted(groups[a],key=lambda r:r['imageId']) for a in authors if a in author_set]
 selected=[]
 for position in range(max(map(len,buckets))):
  for bucket in buckets:
   if position<len(bucket):selected.append(bucket[position])
 return selected[:count]
selection={'validation':select(validation_authors),'acceptance':select(acceptance_authors)}
known_hashes=set(dev_sha)
for p in (ROOT/'benchmark').glob('*.json'):
 import re
 known_hashes.update(re.findall(r'\b[a-f0-9]{64}\b',p.read_text(errors='ignore')))
written=[];all_hashes=set();all_ids=set();index_path=OUT/'split-index.json'
now=json.loads(index_path.read_text())['freezeAtUtc'] if index_path.exists() else datetime.datetime.now(datetime.timezone.utc).isoformat()
base={'schema':'closet-current-parallel68-human-source-split/v1','annotationSource':'https://s3.amazonaws.com/ifashionist-dataset/annotations/instances_attributes_val2020.json','annotationSourceSha256':sha(annotation_bytes),'annotationAttribution':'Fashionpedia Consortium, official val2020 instance annotations; CC BY4.0','annotationLicense':'https://creativecommons.org/licenses/by/4.0/','annotationTermsSource':'https://fashionpedia.github.io/home/data_license.html','imageArchiveSource':'https://s3.amazonaws.com/ifashionist-dataset/images/val_test2020.zip','imageArchiveSha256':'44eb1685364b6ed6bda4595fe0dc07a252e9b923112b97b24ff4d440751a2acc','independentHumanAnnotations':True,'humanAnnotationProvenance':'Fashionpedia original paper section3.2: trained crowd-worker instance masks, supervisor/author review; independent of this assignment. Existing official annotations copied unchanged.','annotationDatasetInfo':data.get('info'),'perAnnotationTimestampAvailable':False,'preInferenceFreezeAtUtc':now,'modelInferenceUsedForSelection':False,'workstreamInferenceRunsAtFreeze':0,'sourcePhotoAndPhotographerDisjointFromDevelopment':True,'fineSubtypeTruthAvailable':False,'colorTruthAvailable':False,'publicDatasetPretrainingOverlap':'unknown; these public val photos are NOT novel/sealed relative to pretrained-model training','scope':'Human object-instance polygons/categories0-26; garment parts excluded; each human shoe annotation remains separate','categories':[c for c in data['categories'] if c['id']<=26]}
with zipfile.ZipFile(ARCHIVE) as z:
 for split,selected in selection.items():
  rows=[]
  for receipt in selected:
   i=images[receipt['imageId']];member='test/'+i['file_name'];content=z.read(member);h=sha(content)
   if h in known_hashes or h in all_hashes or i['id'] in all_ids:raise ValueError('Existing source/hash leakage')
   with Image.open(io.BytesIO(content)) as photo:assert photo.format=='JPEG' and photo.size==(i['width'],i['height'])
   all_hashes.add(h);all_ids.add(i['id']);filename='fashionpedia-val-'+str(i['id'])+'.jpg';path=ROOT/'benchmark/parallel68-photos'/split/filename;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(content)
   rows.append({'id':'fashionpedia-val-'+str(i['id']),'imageId':i['id'],'split':split,'image':filename,'localPath':str(path.relative_to(ROOT)),'width':i['width'],'height':i['height'],'sha256':h,'bytes':len(content),'archiveMember':member,'datasetImage':i,'photoLicenseReceipt':receipt,'annotations':ann[i['id']]})
  manifest={**base,'split':split,'selectionRule':'Whole photographer-group count-balanced split by fixed SHA ordering, then round-robin author/image-ID selection; no model predictions or pixel-derived annotations.','sealedWithinWorkstreamAtFreeze':split=='acceptance','selectedPhotoCount':len(rows),'selectedHumanInstances':sum(len(r['annotations']) for r in rows),'selectedCreators':sorted({r['photoLicenseReceipt']['creatorIdentity'] for r in rows}),'rows':rows}
  path=OUT/(split+'-manifest.json');body=(json.dumps(manifest,indent=2)+'\n').encode()
  if path.exists() and path.read_bytes()!=body:raise ValueError('Refusing to replace frozen manifest')
  path.write_bytes(body);(OUT/(split+'-manifest.sha256')).write_text(sha(body)+'  '+path.name+'\n');written.append((split,manifest,sha(body)))
index={'schema':'closet-current-parallel68-source-splits/v1','eligibilityScreenSnapshotSha256':sha((OUT/'license-screening-frozen.json').read_bytes()),'selectionFrozenBeforeWorkstreamInference':True,'freezeAtUtc':now,'originalDevelopment':{'path':str(dev_path.relative_to(ROOT)),'sha256':sha(dev_path.read_bytes()),'photos':8,'humanInstances':38,'creatorIdentities':sorted(dev_authors)},'splits':{s:{'path':'research/parallel68/data/'+s+'-manifest.json','sha256':h,'photos':len(m['rows']),'humanInstances':m['selectedHumanInstances'],'creatorIdentities':m['selectedCreators'],'categoryCounts':dict(Counter(a['category_id'] for r in m['rows'] for a in r['annotations']))} for s,m,h in written},'sourceIDsDisjoint':True,'sourceJPEGSHAsDisjoint':True,'photographerIdentitiesDisjoint':True,'availableNewPermissiveSourcesAfterScreening':total,'eligiblePhotographers':len(groups),'targetPhotosPerNewSplit':16,'actualPhotosPerNewSplit':count,'goal200DistinctPhotographsMet':False,'fineSubtypeTruthAvailable':False,'colorTruthAvailable':False,'acceptanceState':'SEALED WITHIN WORKSTREAM: do not run until candidate+protocol commit/hash are frozen; after first use never tune on acceptance and still call it untouched. Public pretrained contamination unknown.'}
full=json.loads((OUT/'license-screening.json').read_text());eligible=[r for r in full if not r['excluded']]
index['fullPermissionAudit']={'screenedCandidates':len(full),'eligibleNewPhotos':len(eligible),'eligibleNewPhotographers':len({r['creatorIdentity'] for r in eligible}),'selectionMembershipUnchanged':True}
(OUT/'split-index.json').write_text(json.dumps(index,indent=2)+'\n')
for s,m,h in written:print('FROZEN',s,len(m['rows']),m['selectedHumanInstances'],h)
print('source/photographer disjoint;',total,'eligible sources;',len(groups),'authors')
