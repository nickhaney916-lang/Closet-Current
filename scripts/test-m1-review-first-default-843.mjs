/** P843 genuine Chromium/WebKit execution of actual scanner functions.
 * All classification outcomes are synthetic: this tests save authorization,
 * NOT recognition model accuracy, genuine user permission, or physical phones.
 */
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const app=await readFile('public/app.js','utf8');
const declaration=app.match(/^const reviewFirst836=.*;$/m)?.[0];
assert.equal(declaration,'const reviewFirst836=true;','research build must enforce review for all first scans');
const i=app.indexOf('function automaticAdmissionCore842(');
const j=app.indexOf('async function recognizeBatch(',i);
assert.ok(i>=0&&j>i,'actual P842 scanner/save source boundaries missing');
const scanner=app.slice(i,j);
const prepare=`
const categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];
const $=()=>({textContent:''});
const recognitionState={phase:'ready',activeId:null};
let batch=[],items=[],localReady=true,recognitionUnavailable=false;
const localPending=new Set();
const checkPhoto=async()=>({blank:false,aspect:1,signature:[1,2,3],colorEstimate:null});
const similarPhotos=()=>false;
const segmentationAllows=()=>true;
const render=()=>{};
const message=()=>{};
const persistDraft=()=>{};
const queued=work=>work();
const normalizeClothing=item=>({...item});
const ClothingDetails={fillColor:item=>({...item}),fill:item=>({...item})};
const applyLocalChoice=(item,choice)=>{item.category=choice.category;item.itemType=choice.itemType;};
let writes=0;
const db={transaction(){const tx={oncomplete:null,objectStore(){return {put(){writes++;}}}};
 queueMicrotask(()=>tx.oncomplete?.());return tx;}};
let mockResult;
const localRequest=async()=>mockResult;
const basic=()=>({id:'fresh',image:'data:image/jpeg;base64,QUJDRA==',category:'Uncategorized',
 itemType:'Unknown',color:'Blue',name:'',userAdjusted:false,seasons:[],localAnalyzed:false});
`;
const end=`
window.run843=async type=>{
 writes=0;batch=[basic()];items=[];localPending.clear();localPending.add('fresh');
 recognitionUnavailable=false;recognitionState.phase='ready';
 mockResult=type==='partial'?{strong:false,categoryConfirmed:true,categoryOnly:true,
  choices:[{category:'Tops',itemType:'Unknown',label:'Tops'}],details:{}}:
 {strong:true,categoryConfirmed:true,categoryOnly:false,
  choices:[{category:'Tops',itemType:'T-shirt',label:'a T-shirt'}],details:{}};
 await recognizeItem(batch[0]);
 return {writes,count:items.length,pending:batch.length,
  confirmation:batch[0]?.requiresOwnershipConfirmation===true,
  status:batch[0]?.localStatus};
};
window.direct843=async()=>{
 writes=0;batch=[{...basic(),category:'Tops',itemType:'T-shirt'}];items=[];
 const result=await saveIndexed(batch[0]);
 return {result,writes,count:items.length,pending:batch.length};
};
`;
for(const [browserName,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true,...(browserName==='chromium'?{args:['--no-sandbox']}:{})});
 try{
  for(const width of [320,390,430]){
   const page=await browser.newPage({viewport:{width,height:850},isMobile:true,hasTouch:true});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.setContent('<!doctype html><html><body><main>Owner recognition review acceptance</main></body></html>');
   await page.addScriptTag({content:prepare+declaration+'\n'+scanner+end});
   for(const type of ['strong','partial']){
    const result=await page.evaluate(type=>window.run843(type),type);
    assert.equal(result.writes,0,browserName+' '+width+' '+type+' no database write');
    assert.equal(result.count,0,browserName+' '+width+' '+type+' no saved item');
    assert.equal(result.pending,1,browserName+' '+width+' '+type+' original remains');
    assert.equal(result.confirmation,true,browserName+' '+width+' '+type+' explicit review required');
   }
   const bypass=await page.evaluate(()=>window.direct843());
   assert.equal(bypass.result,false);
   assert.equal(bypass.writes,0);
   assert.equal(bypass.pending,1);
   assert.deepEqual(errors,[]);
   console.log('M1_P843_BROWSER_DEFAULT_REVIEW_CONFIRMED',JSON.stringify({
    browser:browserName,width,strongBlocked:true,broadBlocked:true,
    directSaveBlocked:true,pageErrors:0}));
   await page.close();
  }
 }finally{await browser.close();}
}
