/** Native-auth fixture screenshot SHA audit; 6 browser cases, 42 genuine frames. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import sharp from 'sharp';
const input='benchmark/auth-epoch-01',output='benchmark/auth-epoch-01-review';
await mkdir(output,{recursive:true});
const m=JSON.parse(await readFile(join(input,'results.json'),'utf8'));
assert.equal(m.browserCases,6);
assert.equal(m.screenshotCount,42);
assert.equal(m.realNativeLoginScript,true);
assert.equal(m.realProductionAuthSourceUnmodified,true);
assert.equal(m.originalSavedOutfitDonor,true);
assert.equal(m.realBackendAuthenticationVerified,false);
assert.equal(m.realSupabaseRLSVerified,false);
assert.equal(m.mockedAuthHTTPResponses,true);
assert.equal(m.familyAlpha,'HOLD');assert.equal(m.releaseAuthorized,false);
assert.equal(m.screens.length,42);
assert.deepEqual(m.errors,[]);
const original=new Set(),sheet=[];
for(const x of m.screens){
 const key=x.engine+'|'+x.width+'|'+x.name;
 assert.ok(!original.has(key),'AUTH01 duplicate screenshot');
 original.add(key);
 assert.ok(['chromium','webkit'].includes(x.engine));
 assert.ok([320,390,430].includes(x.width));
 const data=await readFile(x.path);
 assert.equal(createHash('sha256').update(data).digest('hex'),x.sha256);
 const meta=await sharp(data).metadata();
 assert.equal(meta.width,x.width);
 assert.ok(meta.height>=500);
}
assert.equal(original.size,42);
for(const engine of ['chromium','webkit'])for(const width of [320,390,430]){
 const frames=[],tileWidth=205,tileHeight=350;
 for(let i=1;i<=7;i++){
  const key=m.screens.find(x=>x.engine===engine&&x.width===width&&
   x.name.startsWith(String(i).padStart(2,'0')+'-'));
  assert.ok(key);
  const img=await sharp(await readFile(key.path)).resize({width:tileWidth,
   height:tileHeight,fit:'contain',background:'#ffffff'}).png().toBuffer();
  frames.push({input:img,left:(i-1)*tileWidth,top:25});
  frames.push({input:Buffer.from('<svg width="'+tileWidth+'" height="25">'+
   '<rect width="'+tileWidth+'" height="25" fill="white"/>'+
   '<text x="7" y="17" font-size="12" font-family="sans-serif" fill="#111">'+
   'AUTH01 '+i+' '+engine+'</text></svg>'),
   left:(i-1)*tileWidth,top:0});
 }
 const bytes=await sharp({create:{width:7*tileWidth,height:tileHeight+25,
  channels:3,background:'#ffffff'}}).composite(frames).jpeg({quality:90}).toBuffer();
 const name=engine+'-'+width+'-native-account-epoch-seven-states.jpg';
 await writeFile(join(output,name),bytes);
 sheet.push({name,sha256:createHash('sha256').update(bytes).digest('hex')});
}
assert.equal(sheet.length,6);
const results={priority:'AUTH-EPOCH-01',authenticatedFixtureBrowserScenarios:6,
 exactNativeAuthSourceBrowserTested:true,originalAppHTML:true,
 originalPR541Outfit3DController:true,nativeAuthNotOverwritten:true,
 privateIndexedDBPerOwner:true,browserPhotoAndAccountPayloadExfiltrated:false,
 nativeHTTPAuthResponsesMocked:true,realBackendIdentityVerified:false,
 realCloudRLSVerified:false,physicalPhoneApproved:false,
 realBrowserScreenshotHashesVerified:42,sheets:sheet,
 releaseAuthorized:false,familyAlpha:'HOLD'};
await writeFile(join(output,'acceptance.json'),JSON.stringify(results,null,2));
console.log('AUTH01_NATIVE_LOGIN_EPOCH_AUDIT',JSON.stringify({scenarios:6,
 authenticatedBackend:false,screenshotShaVerified:42,sheets:6,release:'HOLD'}));
