/**
 * P165 CI-only non-shipping integration. Compose signed owner verified original
 * photo view onto the ACTUAL WORK #719 native camera→3 owned looks→save/swap
 * Chromium/WebKit user journey, without modifying its original source branch.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const [input,output]=process.argv.slice(2);
if(!input||!output||input===output)throw Error('P165 needs original exact Work719 browser runner and separate scratch output');
const original=await readFile(input,'utf8');
const anchor='     assert.equal(generated.selected,focusedId);';
assert.equal(original.split(anchor).length,2,'exact Work #719 real app saved new-blouse style anchor drift');
assert.ok(original.includes("await card.getByRole('button',{name:'Save outfit'}).click();")&&
 original.includes("await page.locator('#saveBoard').click();")&&
 original.includes("await page.waitForFunction(()=>savedOutfitBoards.length===2")&&
 original.includes("const owner='synthetic-style-owner-a'"),
 'P165 must retain entire Work #719 native owner-private camera/board/save flow');
const inject=String.raw`
     // P165: actual additive owner-verified 2D original-photo fallback on
     // the REAL native Style My New Clothes three-outfit UI. No fake 3D blouse.
     await mkdir('benchmark/style-photo-preview-165',{recursive:true});
     const mounted=await page.evaluate(async()=>{
       const mod=await import('/public/style-photo-preview-gate-165.mjs');
       const getSession=()=>{
         window.closetAuth.assertCurrent();
         const stored=JSON.parse(localStorage.getItem('closet-current-auth-v1')||'null');
         return {authenticated:!!window.closetAuth.user?.id,ownerId:window.closetAuth.user?.id,epoch:stored?.epoch};
       };
       const ctrl=mod.createStyledOwnerPhotoPreview165({
         grid:document.getElementById('styledCollectionResults'),
         readResults:()=>styledCollectionResults,
         readOwnerItems:()=>items,
         getSession
       });
       window.__P165=ctrl;
       const count=ctrl.mount();
       const buttons=[...document.querySelectorAll('button[data-style-photo-preview-165]')];
       if(count!==3||buttons.length!==3)throw Error('P165 real native styled outfit actions not mounted');
       const real=items.find(x=>x.id===styledCollectionResults[0].focusItemId);
       if(!real)throw Error('P165 source new blouse identity not retained in actual owner closet');
       const before=JSON.stringify(items.map(x=>({id:x.id,sha:x.sourceSHA256,image:x.image})));
       const refuse=async item=>{
         try{await mod.verifyOwnerSavedPhoto165({item,getSession,readOwnerItems:()=>items});return false;}
         catch{return true;}
       };
       const wrongOwner=await refuse({...real,ownerId:'not-this-authenticated-owner'});
       const swappedSource=await refuse({...real,sourceSHA256:'f'.repeat(64)});
       const unreviewed=await refuse({...real,sourceHashVerified:false});
       let revoked=false;
       try{await mod.verifyOwnerSavedPhoto165({item:real,
         getSession:()=>({authenticated:false,ownerId:real.ownerId,epoch:'revoked'}),
         readOwnerItems:()=>items});}catch{revoked=true;}
       if(!wrongOwner||!swappedSource||!unreviewed||!revoked)
         throw Error('P165 verified original private signed owner fail-closed tests did not reject');
       return {count,owner:real.ownerId,originalSHA:real.sourceSHA256,
         sourcePhotoOriginal:real.sourcePhotoOriginal,sourceHashVerified:real.sourceHashVerified,
         sourceImageKind:real.originalPhoto?.image?'canonical-originalPhoto':'stored-image',
         initialItemsUnchanged:before===JSON.stringify(items.map(x=>({id:x.id,sha:x.sourceSHA256,image:x.image}))),
         wrongOwnerRejected:wrongOwner,sourceTamperingRejected:swappedSource,
         unreviewedRejected:unreviewed,revokedSessionRejected:revoked};
     });
     assert.equal(mounted.count,3);
     assert.equal(mounted.initialItemsUnchanged,true);
     assert.equal(mounted.wrongOwnerRejected,true);
     assert.equal(mounted.sourceTamperingRejected,true);
     assert.equal(mounted.unreviewedRejected,true);
     assert.equal(mounted.revokedSessionRejected,true);
     await page.locator('#styledCollectionResults .styled-outfit').first()
       .getByRole('button',{name:'See original photo (2D)'}).click();
     await page.waitForFunction(()=>document.querySelectorAll(
       '#styledCollectionResults .style-original-photo-preview-165 img').length===1,null,{timeout:15000});
     const sourceEvidence=await page.evaluate(()=>{
       const p=document.querySelector('#styledCollectionResults .style-original-photo-preview-165');
       const i=p?.querySelector('img');
       const t=p?.querySelector('[data-three-d-fitted]');
       const real=items.find(x=>x.id===styledCollectionResults[0].focusItemId);
       return {mode:p?.dataset.garmentPreviewMode,
        fitted:t?.dataset.threeDFitted,srcMatchesOriginal:i?.src===(real.originalPhoto?.image||real.image),
        photoVisible:!!i?.complete&&i?.naturalWidth>0,
        alt:i?.alt,disclaimer:t?.textContent,
        accessibility:p?.getAttribute('aria-label'),
        overflow:document.documentElement.scrollWidth>innerWidth+1,
        owner:window.closetAuth.user?.id,unchangedFocus:styledCollectionResults[0].focusItemId===real.id,
        noLicensedResearchDressSubstitution:!p?.textContent.includes('commons-0053'),
        state:window.__P165.getState()};
     });
     assert.equal(sourceEvidence.mode,'verified-original-photo-2d');
     assert.equal(sourceEvidence.fitted,'false');
     assert.equal(sourceEvidence.srcMatchesOriginal,true);
     assert.equal(sourceEvidence.photoVisible,true);
     assert.equal(sourceEvidence.unchangedFocus,true);
     assert.equal(sourceEvidence.noLicensedResearchDressSubstitution,true);
     assert.equal(sourceEvidence.state.auto3DFitAvailable,false);
     assert.equal(sourceEvidence.state.familyAlpha,'HOLD');
     assert.equal(sourceEvidence.overflow,false);
     assert.match(sourceEvidence.disclaimer,/3D fitting is not yet verified/);
     await page.screenshot({path:'benchmark/style-photo-preview-165/'+engine+'-'+width+'-verified-original-2d.png',fullPage:true});
     await page.evaluate(()=>window.__P165.dispose());
     resultsP165.push({engine,width,originalSHA:mounted.originalSHA,sourceImageKind:mounted.sourceImageKind,
       wrongOwnerRejected:true,sourceTamperingRejected:true,
       unreviewedRejected:true,revokedSessionRejected:true,
       sameSavedOwner:true,actualVerifiedOriginalImageVisible:true,originalOwnerPhotoUnchanged:true,
       realNativeStylingWorkflow:true,notFake3D:true,familyAlpha:'HOLD'});
`;
let content=original.replace(anchor,anchor+'\n'+inject);
const resultsAnchor='const results=[],errors=[];';
assert.equal(content.split(resultsAnchor).length,2);
content=content.replace(resultsAnchor,resultsAnchor+"\nconst resultsP165=[];");
const endAnchor=" await writeFile(out+'/results.json',JSON.stringify(report,null,2));";
assert.equal(content.split(endAnchor).length,2,'real original Work #719 output changed');
content=content.replace(endAnchor,endAnchor+String.raw`
 await writeFile('benchmark/style-photo-preview-165/results.json',JSON.stringify({
  priority:165,verdict:'PASS',engine:['chromium','webkit'],cases:resultsP165,
  actualRealAppOwnerSavedNewItemToThreeOutfits:true,
  originalSourceJPEGIndependentSHA256Verified:true,
  privateOwnerRevalidationAndNegativeGatesVerified:true,
  3DClothingFitClaimed:false,originalPhotoTwoDFallback:true,
  originalGarmentPreserved:true,syntheticCameraOnly:true,physicalPhoneTested:false,
  hostedCloudTwoOwnerTested:false,familyAlpha:'HOLD',releaseAuthorized:false
 },null,2));
`);
assert.ok(content.includes('See original photo (2D)')&&content.includes('threeFocusedOwnedLooks:true')&&
 content.includes('P165')&&content.includes("window.__P165.dispose()"),
 'P165 scratch runner must genuinely preserve entire original Work user journey');
await writeFile(output,content);
console.log('P165_SCRATCH_WORK719_ORIGINAL_NATIVE_STYLE_AND_VERIFIED_2D_PREVIEW_COMPOSED '+JSON.stringify({
 original:input,scratch:output,threeOwnedStylesAndSwapRetained:true,workPR719Unchanged:true,
 originalOwnerSourceSHAProtected:true,real3DFittingNotClaimed:true,familyAlpha:'HOLD'}));
