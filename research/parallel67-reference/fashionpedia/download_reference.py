#!/usr/bin/env python3
"""Reproduce frozen unmodified dataset JPEGs; fail on archive/image changes."""
import hashlib,json,urllib.request,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
META=Path(__file__).parent
manifest=json.loads((META/'manifest.json').read_text())
expected=(META/'manifest.sha256').read_text().split()[0]
if hashlib.sha256((META/'manifest.json').read_bytes()).hexdigest()!=expected:raise ValueError('Frozen reference manifest changed')
cache=Path('/tmp/p67-fashionpedia-val-images.zip')
if not cache.exists():
    request=urllib.request.Request(manifest['imageArchiveSource'],headers={'User-Agent':'ClosetCurrentParallel67Research/1.0'})
    with urllib.request.urlopen(request,timeout=120) as response,cache.open('wb') as out:
        while chunk:=response.read(1024*1024):out.write(chunk)
if hashlib.sha256(cache.read_bytes()).hexdigest()!=manifest['imageArchiveSha256']:raise ValueError('Official archive SHA changed')
photos=ROOT/'benchmark/parallel67-reference-photos';photos.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(cache) as archive:
    for row in manifest['rows']:
        content=archive.read(row['archiveMember'])
        if hashlib.sha256(content).hexdigest()!=row['sha256']:raise ValueError('Dataset JPEG SHA mismatch: '+row['id'])
        (photos/row['image']).write_bytes(content)
print('Verified frozen Fashionpedia original dataset JPEGs:',len(manifest['rows']))
