#!/usr/bin/env python3
"""Recover SHA-locked original public JPEGs, without recoding or model calls."""
import hashlib,json,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[3]
rows=json.loads((Path(__file__).parent/'reviewed-development.json').read_text())['rows']
destination=root/'benchmark/parallel67-photos';destination.mkdir(parents=True,exist_ok=True)
for row in rows:
    path=destination/row['image']
    if path.exists() and hashlib.sha256(path.read_bytes()).hexdigest()==row['sha256']:continue
    request=urllib.request.Request(row['originalUrl'],headers={'User-Agent':'ClosetCurrentParallel67Research/1.0 (https://github.com/nickhaney916-lang/Closet-Current/issues/892)'})
    with urllib.request.urlopen(request,timeout=40) as response:content=response.read(12*1024*1024+1)
    if len(content)>12*1024*1024 or not content.startswith(b'\xff\xd8') or hashlib.sha256(content).hexdigest()!=row['sha256']:raise ValueError('Original source changed/unavailable: '+row['id'])
    path.write_bytes(content)
print('Verified',len(rows),'original public JPEGs')
