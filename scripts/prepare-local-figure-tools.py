#!/usr/bin/env python3
"""Explicitly acquire pinned free public tools/assets for offline figure creation."""
import hashlib,json,subprocess,tarfile,urllib.request,argparse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BLENDER_URL='https://download.blender.org/release/Blender4.3/blender-4.3.0-linux-x64.tar.xz'
BLENDER_SHA='6264ff4cf50baf6be6091a28d3c29cf25dc38d8daa3082874ce94d520d3e6ab6'
def main():
 p=argparse.ArgumentParser();p.add_argument('--acquire',action='store_true',help='Download pinned Blender and CC0 source assets, never customer data');args=p.parse_args()
 if not args.acquire:p.error('Explicit --acquire required; this preparation downloads public files')
 out=ROOT/'artifacts/figure-creation/tools';out.mkdir(parents=True,exist_ok=True)
 archive=out/'blender-4.3.0-linux-x64.tar.xz'
 if not archive.exists():
  partial=archive.with_suffix('.partial')
  subprocess.run(['curl','--fail','--location','--retry','3','--max-time','180','--output',str(partial),BLENDER_URL],check=True)
  if hashlib.sha256(partial.read_bytes()).hexdigest()!=BLENDER_SHA:raise ValueError('Downloaded archive SHA-256 mismatch')
  partial.replace(archive)
 if hashlib.sha256(archive.read_bytes()).hexdigest()!=BLENDER_SHA:raise ValueError('Official Blender archive SHA-256 mismatch')
 binary=out/'blender-4.3.0-linux-x64/blender'
 if not binary.exists():
  with tarfile.open(archive)as t:t.extractall(out,filter='data')
 lock=json.loads((ROOT/'benchmark/figure-creation/source-lock.json').read_text());vendor=ROOT/'artifacts/figure-creation/vendor'
 if not(vendor/'.git').exists():
  vendor.mkdir(parents=True,exist_ok=True)
  subprocess.run(['git','init',str(vendor)],check=True)
  subprocess.run(['git','-C',str(vendor),'fetch','--depth','1',lock['repository'],lock['revision']],check=True)
 subprocess.run(['git','-C',str(vendor),'checkout',lock['revision'],'--',*[r['path']for r in lock['files']]],check=True)
 for row in lock['files']:
  if hashlib.sha256((vendor/row['path']).read_bytes()).hexdigest()!=row['sha256']:raise ValueError('Source/license mismatch: '+row['path'])
 (ROOT/'artifacts/figure-creation/toolchain.json').write_text(json.dumps({'blenderUrl':BLENDER_URL,'blenderArchiveSha256':BLENDER_SHA,'sourceRevision':lock['revision'],'network':'Only public tool and CC0 asset downloads; no inference or uploads'},indent=2)+'\n')
 print('Prepared verified Blender',binary,'and source',vendor)
if __name__=='__main__':main()
