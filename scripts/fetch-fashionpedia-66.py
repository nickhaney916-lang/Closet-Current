"""Reproduce six public research photos and publisher-provided human polygons.
No owner review is asserted. Photos remain uncommitted runtime inputs.
"""
import hashlib,io,json,pathlib,urllib.request,zipfile
manifest=json.loads(pathlib.Path('research/real-garment-acceptance-66/fashionpedia-sample.json').read_text())
annotation=urllib.request.urlopen(manifest['annotationURL']).read()
assert hashlib.sha256(annotation).hexdigest()==manifest['annotationSHA256']
truth=json.loads(annotation);images={r['id']:r for r in truth['images']};annotations={r['id']:r for r in truth['annotations']}
raw=urllib.request.urlopen(manifest['archiveURL']).read();archive=zipfile.ZipFile(io.BytesIO(raw))
out=pathlib.Path('benchmark/real-garment-acceptance-66/fashionpedia');out.mkdir(parents=True,exist_ok=True)
for row in manifest['rows']:
 image=images[row['id']]
 assert image['license']==8
 for key,value in image.items():assert row[key]==value
 expected=[a for a in truth['annotations'] if a['image_id']==row['id'] and a['category_id'] in [0,1,2,3,4,5,6,7,8,9,10,23]]
 assert expected==row['annotations']
 photo=archive.read(row['archiveMember'])
 assert len(photo)==row['bytes'] and hashlib.sha256(photo).hexdigest()==row['sha256']
 (out/row['file_name']).write_bytes(photo)
print(json.dumps({'photos':len(manifest['rows']),'publisherHumanInstances':sum(len(r['annotations']) for r in manifest['rows']),'ownerReviews':0,'annotationSHA256':manifest['annotationSHA256'],'familyAlpha':'HOLD'}))
