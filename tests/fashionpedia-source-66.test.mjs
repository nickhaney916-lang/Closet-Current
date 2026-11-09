import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {measureUpperSilhouette62} from '../research/user-photo-to-anatomical-3d-62/silhouette-fit.mjs';
const manifest=JSON.parse(readFileSync('research/real-garment-acceptance-66/fashionpedia-sample.json','utf8'));
test('P66 external human polygons retain source, ontology and rights; never become owner approval, color or exact subtype truth',()=>{
 assert.equal(manifest.rows.length,6);assert.equal(manifest.rows.reduce((n,r)=>n+r.annotations.length,0),16);
 assert.equal(new Set(manifest.rows.map(r=>r.sha256)).size,6);
 assert.equal(manifest.annotationSHA256,'f831f415edad12d52acde8b138fe7ebd1592b57bf0dcd6a3b63ba8cabd208223');
 for(const r of manifest.rows){
  assert.equal(r.license,8);assert.equal(r.primaryColor,null);assert.equal(r.exactAppSubtype,null);
  for(const a of r.annotations){
   assert.equal(a.image_id,r.id);assert.ok(manifest.categories.some(c=>c.id===a.category_id));
   for(const poly of a.segmentation){assert.equal(poly.length%2,0);assert.ok(poly.length>=6);for(let i=0;i<poly.length;i++)assert.ok(Number.isFinite(poly[i])&&poly[i]>=0&&poly[i]<=(i%2?r.height:r.width));}
  }
  assert.equal(measureUpperSilhouette62({sourceId:'fashionpedia-'+r.id,sourceSHA256:r.sha256,cutoutSHA256:'6'.repeat(64),reviewConfirmed:true,data:new Uint8ClampedArray(64*64*4),width:64,height:64}).accepted,false);
 }
 assert.equal(manifest.independentOwnerReview,false);assert.equal(manifest.releaseAuthorized,false);
});
