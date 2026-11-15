/**
 * Independent P92 re-entry diagnosis: run the unchanged real M51 native app
 * WebKit script repeatedly with a failure-only read-only diagnostic hook.
 * No modification to public, authored clothes, sessions or browser assertions.
 */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,unlinkSync,mkdirSync} from 'node:fs';
import {spawnSync,execFileSync} from 'node:child_process';
import {join} from 'node:path';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const sha=git('rev-parse','HEAD');
assert.equal(sha,process.env.P92_CHECKOUT_SHA,'exact source commit required');
const base='878d624d8963109143c8775bb156bda4ba12a196';
assert.equal(git('merge-base',base,sha),base,'M4 ancestry mismatch');
const sourceFile='scripts/test-main51-real-app-owner-original-2d.mjs';
assert.equal(git('rev-parse','HEAD:'+sourceFile),
 '1150a6db461b1d5968183d1c9e798cac7ae88478','native M51 browser source changed');
assert.equal(git('rev-parse','HEAD:public/app.js'),
 'd259d0b77a006d032699be50536adb2ebca459dd','main consumer altered');
assert.equal(git('rev-parse','HEAD:public/outfit-board.js'),
 '153455379b0b6d777eff8c1c508c129208c7fadc','main board altered');
const original=readFileSync(sourceFile,'utf8');
const marker='if(approved)assert.match(status,';
assert.equal(original.split(marker).length,2,'native assertion hook unexpectedly moved');
const diagnosticSnippet="\nif(approved&&!/original photo\\(s\\) verified.*2D only/.test(status)){\n let details={classification:'refusal-without-source-error'};\n try{\n  details=await page.evaluate(async()=>{\n    const state={\n      classification:'real-native-preview-reentry-refused',\n      previewPhase:mission4Preview1054Viewer?.status?.phase||'not-mounted',\n      photoCount:document.querySelectorAll('#mission4Preview1054Photos img').length,\n      research3DCanvasCount:document.querySelectorAll('#outfit3D01Canvas').length,\n      signedOwnerAvailable:!!window.closetAuth?.user?.id,\n      ownerDbOpen:!!db&&typeof db.transaction==='function',\n      boardHasTop:!!currentBoard?.slots?.top,\n      boardOccasion:currentBoard?.occasion||'missing',\n      originalSessionAvailable:typeof currentPhotoOwnerSession167==='function',\n      readSavedAvailable:typeof signedOwnerSavedRows167==='function',\n      buttonDisabled:!!document.querySelector('#mission4Preview1054Section button')?.disabled\n    };\n    try{\n      const {preflightOwnedOutfit1054}=await import('/research/main-thread-integration-1054/source-to-outfit.mjs');\n      const plan=await preflightOwnedOutfit1054({\n        getSession:currentPhotoOwnerSession167,\n        readOwnerItems:signedOwnerSavedRows167,\n        cleanBoard:cleanOutfitBoard,\n        board:structuredClone(currentBoard)\n      });\n      state.readOnlySourcePreflight=plan.status==='source-verified-2d-only'?'pass-2d-only':'unexpected-response';\n    }catch(e){\n      const text=String(e?.message||'');\n      state.readOnlySourcePreflight=/^MAIN1054 [a-zA-Z -]+$/.test(text)?text.slice(0,145):'error-class:'+String(e?.name||'Error').slice(0,40);\n    }\n    return state;\n  });\n }catch(error){details={classification:'diagnostic-exception',errorClass:String(error?.name||'Error')};}\n console.error('P92_WEBKIT_REENTRY_CLASSIFICATION',JSON.stringify(details));\n}\n";
const copy=original.replace(marker,diagnosticSnippet+'\n  '+marker);
const scratch='scripts/.parallel92-m51-webkit-diagnostic.generated.mjs';
const requested=Number(process.env.P92_REENTRY_RUNS||8);
assert.ok(Number.isSafeInteger(requested)&&requested>=2&&requested<=12);
const dest='benchmark/parallel92-webkit-reentry';
mkdirSync(dest,{recursive:true});
const rows=[];
try{
 writeFileSync(scratch,copy);
 for(let trial=1;trial<=requested;trial++){
  const started=Date.now();
  const r=spawnSync(process.execPath,[scratch],{
   cwd:process.cwd(),encoding:'utf8',maxBuffer:12_000_000,timeout:600000,
   env:{...process.env,M51_ENGINE:'webkit'}
  });
  const diagnostics=((r.stdout||'')+'\n'+(r.stderr||'')).split('\n')
   .filter(x=>x.includes('MAIN51_APP_SOURCE_FAIL ')||x.includes('P92_WEBKIT_REENTRY_CLASSIFICATION '))
   .map(line=>{
    const index=line.indexOf('P92_WEBKIT_REENTRY_CLASSIFICATION ');
    const old=line.indexOf('MAIN51_APP_SOURCE_FAIL ');
    let value;
    try{value=JSON.parse(index>=0?line.slice(index+34):line.slice(old+23));}
    catch{return {classification:'unparsed-diagnostic'};}
    return {stage:value.stage||null,width:value.width||null,
     errorName:value.errorName||null,classification:value.classification||null,
     previewPhase:value.previewPhase||null,photoCount:value.photoCount??null,
     signedOwnerAvailable:value.signedOwnerAvailable??null,
     ownerDbOpen:value.ownerDbOpen??null,boardHasTop:value.boardHasTop??null,
     boardOccasion:value.boardOccasion||null,
     readOnlySourcePreflight:value.readOnlySourcePreflight||null};
   });
  const record={trial,engine:'webkit',widths:[320,390,430],actualNativeApp:true,
    realLicensedOriginal:true,syntheticOwnerApproval:true,
    status:r.status===0?'PASS':'FAIL',elapsedMs:Date.now()-started,diagnostics};
  rows.push(record);
  console.log('P92_M51_NATIVE_WEBKIT_REENTRY',JSON.stringify(record));
  if(r.error||r.status!==0){
   console.error('P92_M51_REENTRY_FAIL',JSON.stringify({
    trial,errorName:r.error?.name||null,exitCode:r.status,diagnostics
   }));
   break; // never make a failure green by retrying it.
  }
 }
}finally{try{unlinkSync(scratch);}catch{}}
const receipt={schema:'P92_WEBKIT_NATIVE_M51_FOCUS_REENTRY_DIAG/v1',
  exactHead:sha,requested,attempted:rows.length,pass:rows.every(x=>x.status==='PASS'),
  fullSuccess:rows.length===requested&&rows.every(x=>x.status==='PASS'),
  sourceOriginalTestUnmodified:true,publicAppUntouched:true,
  noOriginalJPEGOrScreenshotArchived:true,no3DAdmission:true,
  hostedSignedRLS:false,actualPhysicalPhone:false,
  independentHumanGroundTruth:false,familyAlpha:'HOLD',releaseAllowed:false,rows};
writeFileSync(join(dest,'result.json'),JSON.stringify(receipt,null,2)+'\n');
assert.equal(receipt.fullSuccess,true,'real native WebKit preview re-entry failed, original result retained');
console.log('P92_M51_WEBKIT_STRICT_STRESS_PASS',JSON.stringify({
 exactHead:sha,repeatedFreshBrowsers:requested,widths:[320,390,430],familyAlpha:'HOLD'
}));
