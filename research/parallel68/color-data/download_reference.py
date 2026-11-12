"""Recover exact pinned dataset JPEGs; no color inference or model annotation."""
import hashlib,json,tarfile,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];META=Path(__file__).parent
DEST=ROOT/'benchmark/parallel68-color-photos';DEST.mkdir(parents=True,exist_ok=True)
CACHE=Path('/tmp/closet-current-p68-color-archives');CACHE.mkdir(exist_ok=True)
for split in ['development','acceptance']:
    path=META/(split+'.json')
    content=path.read_bytes();expected=(META/(split+'.sha256')).read_text().split()[0]
    if hashlib.sha256(content).hexdigest()!=expected:raise ValueError('Frozen '+split+' color reference changed')
    manifest=json.loads(content)
    handles={}
    for name,source in manifest['archives'].items():
        archive=CACHE/name
        if not archive.exists() or hashlib.sha256(archive.read_bytes()).hexdigest()!=source['sha256']:
            with urllib.request.urlopen(source['url'],timeout=45) as response:payload=response.read(64*1024*1024)
            if hashlib.sha256(payload).hexdigest()!=source['sha256']:raise ValueError('Pinned color archive changed')
            archive.write_bytes(payload)
        handles[name]=tarfile.open(archive)
    for row in manifest['rows']:
        data=handles[row['archive']].extractfile(row['archiveMember']).read()
        if not data.startswith(b'\xff\xd8') or hashlib.sha256(data).hexdigest()!=row['sha256']:raise ValueError('Color source JPEG changed')
        (DEST/row['image']).write_bytes(data)
    for handle in handles.values():handle.close()
    print('SHA-verified',split,len(manifest['rows']),'source dataset JPEGs; no inference')
