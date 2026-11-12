import test from 'node:test';
import assert from 'node:assert/strict';
import {
 P67_05_SEARCHES,inspectCommonsSearchResponse05,combineSourceCandidates05,
 searchCommonsCandidates05
} from '../scripts/parallel67-commons-source-intake-05.mjs';

const seed=P67_05_SEARCHES.find(x=>x.target==='Blouse');
const base=(changes={})=>({
 pageid:123456,title:'File:Demonstration blouse.jpg',
 imageinfo:[{
  mime:'image/jpeg',size:100000,width:1400,height:1200,
  url:'https://upload.wikimedia.org/wikipedia/commons/a/ab/Demonstration_blouse.jpg',
  thumburl:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Demonstration_blouse.jpg/640px-Demonstration_blouse.jpg',
  sha1:'f'.repeat(40),
  extmetadata:{
   LicenseShortName:{value:'CC BY 4.0'},
   LicenseUrl:{value:'https://creativecommons.org/licenses/by/4.0/'}
  },
  ...changes
 }]
});
const response=(entries=[base()])=>({query:{pages:entries}});
test('P67-05 source search gives exactly nine high-priority queries; these are NOT clothing ground truth',()=>{
 assert.equal(P67_05_SEARCHES.length,20);
 assert.deepEqual([...new Set(P67_05_SEARCHES.map(x=>x.target))],[
  'T-shirt','Sweatshirt','Blouse','Tunic','Sneakers','Boots','Dress','Skirt','nonclothing'
 ]);
 const found=inspectCommonsSearchResponse05(seed,response());
 assert.equal(found.length,1);
 const c=found[0];
 assert.equal(c.status,'quarantine_not_training_ground_truth');
 assert.equal(c.originalGarmentLabel,null);
 assert.equal(c.categoryHumanLabel,null);
 assert.equal(c.primaryColorHumanLabel,null);
 assert.equal(c.sourcePixelsSha256,null);
 assert.equal(c.reviewerA,null);
 assert.equal(c.reviewerB,null);
 assert.equal(c.dataSplit,null);
 assert.equal(c.targetSearchTerm,'Blouse');
 assert.equal(c.licenseVerifiedByHuman,false);
 assert.equal(c.originalPhotographReviewed,false);
 assert.equal(c.consentAndPersonRightsReviewed,false);
 assert.ok(c.sourcePage.startsWith('https://commons.wikimedia.org/wiki/'));
});
test('P67-05 image titles do not bypass license rights, file format, source SHA, dimensions or metadata',()=>{
 const invalid=[
  {mime:'image/svg+xml'}, {size:40},{size:30*1024*1024},
  {width:16},{height:128},{sha1:'not-sha'},
  {url:'https://private.example.com/private.jpg',thumburl:undefined},
  {thumburl:'https://example.com/tracker.jpg'},
  {extmetadata:{LicenseShortName:{value:'All rights reserved'},
    LicenseUrl:{value:'https://example.com'}}},
  {extmetadata:{LicenseShortName:{value:'CC BY-NC 4.0'},
    LicenseUrl:{value:'https://creativecommons.org/licenses/by-nc/4.0/'}}},
  {extmetadata:{LicenseShortName:{value:'CC BY-ND 4.0'},
    LicenseUrl:{value:'https://creativecommons.org/licenses/by-nd/4.0/'}}},
  {extmetadata:{LicenseShortName:{value:'CC BY 4.0'},
    LicenseUrl:{value:'https://attacker.example.com/licenses/by/4.0/'}}},
 ];
 for(const meta of invalid)assert.equal(
  inspectCommonsSearchResponse05(seed,response([base(meta)])).length,0,
  'restricted or unverified metadata must remain ineligible candidate source');
});
test('P67-05 Commons metadata may use legacy http creativecommons attribution links, but cannot certify image rights',()=>{
 const p=base({extmetadata:{LicenseShortName:{value:'CC0 1.0'},
  LicenseUrl:{value:'http://creativecommons.org/publicdomain/zero/1.0/'}}});
 const found=inspectCommonsSearchResponse05(seed,response([p]));
 assert.equal(found.length,1);
 assert.equal(found[0].licenseVerifiedByHuman,false);
 assert.equal(found[0].listedLicense,'CC0 1.0');
});
test('P67-05 image filenames, search terms, and uploader metadata never become human-authenticated labels',()=>{
 const a=base();
 a.title='File:Definitely sweatshirt dress and blouse.jpg';
 const found=inspectCommonsSearchResponse05(seed,response([a]));
 assert.equal(found.length,1);
 assert.equal(found[0].originalGarmentLabel,null);
 assert.equal(found[0].status,'quarantine_not_training_ground_truth');
 for(const bad of [
  {originalGarmentLabel:'Blouse'},
  {categoryHumanLabel:'Tops'},
  {sourcePixelsSha256:'a'.repeat(64)},
  {status:'verified'},
  {reviewerA:'FAKE_REVIEWER'},
  {reviewerB:'FAKE_REVIEWER'},
  {primaryColorHumanLabel:'Blue'}
 ]){
  const altered={...found[0],...bad};
  assert.throws(()=>combineSourceCandidates05([altered],[]),/P67-05/);
 }
});
test('P67-05 candidate merge silently skips already used source titles and repeated original identities',()=>{
 const first=inspectCommonsSearchResponse05(seed,response())[0];
 const dupe={...first,intakeKey:'commons-page-234567'};
 const novel={...first,intakeKey:'commons-page-456789',commonsOriginalSha1:'1'.repeat(40),
  sourceTitle:'File:Other fashion item.jpg'};
 assert.equal(combineSourceCandidates05([first,dupe,novel],[]).length,2);
 assert.equal(combineSourceCandidates05([first,novel],[{
  attribution:{title:'File:Demonstration blouse.jpg'}
 }]).length,1);
});
test('P67-05 query receives actual Commons url/imageinfo and returns unlabelled license-screened rows',async()=>{
 let calls=0;
 const f=async(url,init)=>{
  calls++;
  assert.equal(url.hostname,'commons.wikimedia.org');
  assert.equal(url.searchParams.get('action'),'query');
  assert.equal(url.searchParams.get('generator'),'search');
  assert.equal(url.searchParams.get('gsrnamespace'),'6');
  assert.equal(url.searchParams.get('gsrsearch'),seed.query);
  assert.equal(init.headers.Accept,'application/json');
  return {ok:true,status:200,json:async()=>response()};
 };
 const got=await searchCommonsCandidates05(seed,{fetchImpl:f});
 assert.equal(got.length,1);
 assert.equal(calls,1);
 assert.equal(got[0].sourcePixelsSha256,null);
});
test('P67-05 invalid query, oversized search, nonlicense source and corrupted response fail closed',async()=>{
 await assert.rejects(searchCommonsCandidates05({target:'PRIVATE_PERSON',query:'bad'}),/P67-05/);
 await assert.rejects(searchCommonsCandidates05(seed,{limit:100}),/P67-05/);
 await assert.rejects(searchCommonsCandidates05(seed,{fetchImpl:async()=>({
  ok:true,status:200,json:async()=>({error:{code:'permission-denied'}})
 }),maxAttempts:1}),/P67-05/);
 const mock=()=>({ok:true,status:200,json:async()=>({query:{pages:[]}})});
 assert.deepEqual(await searchCommonsCandidates05(seed,{fetchImpl:mock,maxAttempts:1}),[]);
});
test('P67-05 source intake only accepts known target queries and disallows source HTML or unsafe raw license fragments',()=>{
 assert.throws(()=>inspectCommonsSearchResponse05({target:'Blouse',query:'PERSONAL_EMAIL'},response()),/P67-05/);
 const b=base();b.title='File:<script>PRIVATE_PERSON</script>.jpg';
 assert.equal(inspectCommonsSearchResponse05(seed,response([b])).length,0);
 const c=base({extmetadata:{LicenseShortName:{value:'CC BY 4.0'},
  LicenseUrl:{value:'javascript:alert(1)'}}});
 assert.equal(inspectCommonsSearchResponse05(seed,response([c])).length,0);
});
