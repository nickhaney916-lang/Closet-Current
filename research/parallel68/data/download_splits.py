#!/usr/bin/env python3
"""Recover selected unmodified public dataset JPEGs with immutable hashes."""
import argparse,hashlib,json,urllib.request,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];OUT=Path(__file__).resolve().parent
parser=argparse.ArgumentParser();parser.add_argument('--split',choices=['validation','acceptance','all'],default='validation');args=parser.parse_args()
sha=lambda b:hashlib.sha256(b).hexdigest()
splits=['validation','acceptance'] if args.split=='all' else [args.split]
manifests=[]
for split in splits:
 path=OUT/(split+'-manifest.json');data=path.read_bytes()
 if sha(data)!=(OUT/(split+'-manifest.sha256')).read_text().split()[0]:raise ValueError('Frozen split manifest changed')
 manifests.append(json.loads(data))
archive=Path('/tmp/p68-fashionpedia-val-images.zip')
if not archive.exists():
 request=urllib.request.Request(manifests[0]['imageArchiveSource'],headers={'User-Agent':'ClosetCurrentParallel68Research/1.0 (https://github.com/nickhaney916-lang/Closet-Current/issues/909)'})
 with urllib.request.urlopen(request,timeout=60) as response,archive.open('wb') as target:
  while block:=response.read(1024*1024):target.write(block)
if any(sha(archive.read_bytes())!=m['imageArchiveSha256'] for m in manifests):raise ValueError('Official dataset archive changed')
count=0
with zipfile.ZipFile(archive) as z:
 for manifest in manifests:
  for row in manifest['rows']:
   path=ROOT/row['localPath'];content=z.read(row['archiveMember'])
   if sha(content)!=row['sha256'] or not content.startswith(b'\xff\xd8'):raise ValueError('Selected dataset JPEG changed: '+row['id'])
   path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(content);count+=1
print('Verified/recovered',count,'dataset JPEGs; no inference performed; acceptance remains model-unexposed until protocol-controlled first use')
