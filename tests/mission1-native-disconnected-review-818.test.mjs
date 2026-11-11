import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync('public/app.js','utf8');
function sourceFunction(start,end){
 const a=source.indexOf(start);
 const b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'actual native app function anchors are present');
 return source.slice(a,b);
}
function candidateHarness(){
 const nodes=new Map(),queued=[];
 const $=id=>{
  if(!nodes.has(id))nodes.set(id,{textContent:'',src:'',hidden:true});
  return nodes.get(id);
 };
 const c={items:[],batch:[],sessionCapturedIds:new Set(),session:0,
  crypto:{randomUUID:()=> 'owner-source-piece'},normalizeClothing:x=>({...x}),
  queued,queueAutomatic:p=>queued.push(p),persistDraft:()=>{},$,message:()=>{}};
 vm.createContext(c);
 vm.runInContext(sourceFunction('function candidate(image,options={}){','function queueAutomatic(item){'),c);
 return c;
}
test('P818 real native candidate preserves an ambiguous original and requires owner confirmation',()=>{
 const ctx=candidateHarness();
 const sourceImage='data:image/jpeg;base64,AAAA';
 const originalPhoto={image:sourceImage};
 const flagged={categories:['Tops','Outerwear'],types:[],
  sourceDisconnectedReviewRequired:true,sourceIslandCount:2};
 assert.equal(ctx.candidate('data:image/jpeg;base64,AABB',
  {outfitSourceId:'outfit-source',originalPhoto,segmentHint:flagged}),true);
 assert.equal(ctx.batch.length,1);
 const item=ctx.batch[0];
 assert.equal(item.requiresOwnershipConfirmation,true);
 assert.equal(item.segmentHint.sourceDisconnectedReviewRequired,true);
 assert.equal(item.originalPhoto,originalPhoto);
 assert.equal(item.outfitSourceId,'outfit-source');
 assert.equal(ctx.queued.length,1);
 assert.equal(ctx.session,1);
});
test('P818 unchanged ordinary one-piece outfit proposal uses the previous review behavior',()=>{
 const ctx=candidateHarness();
 assert.equal(ctx.candidate('data:image/jpeg;base64,AABB',
  {outfitSourceId:'outfit-source',segmentHint:{categories:['Tops'],sourceDisconnectedReviewRequired:false}}),true);
 assert.equal(ctx.batch[0].requiresOwnershipConfirmation,false);
});
test('P818 actual native recognition path does NOT classify, color or save the ambiguous source union',async()=>{
 const start='async function recognizeItem(item){';
 const end='  if(!item.userAdjusted)Object.assign(item,ClothingDetails.fillColor(item,quality.colorEstimate));';
 const partial=sourceFunction(start,end)+'\n }catch(error){throw error;}\n}';
 const item={id:'ambiguous-item',image:'data:image/jpeg;base64,AABB',color:'',
  category:'Uncategorized',localAnalyzed:false,requiresOwnershipConfirmation:true,
  segmentHint:{categories:['Tops','Outerwear'],sourceDisconnectedReviewRequired:true,sourceIslandCount:2}};
 const recorded={classifier:0,saved:0,renders:0};
 const c={batch:[item],recognitionState:{phase:'idle'},checkPhoto:async()=>({
  blank:false,colorEstimate:{color:'Red'},signature:'mock',aspect:1
 }),render:()=>recorded.renders++,localRequest:async()=>{recorded.classifier++;throw Error('should not infer a single garment');},
 saveIndexed:async()=>{recorded.saved++;throw Error('should not persist');}};
 vm.createContext(c);
 vm.runInContext(partial,c);
 assert.equal(await c.recognizeItem(item),true);
 assert.equal(recorded.classifier,0);
 assert.equal(recorded.saved,0);
 assert.equal(item.localAnalyzed,true);
 assert.equal(item.color,'');
 assert.equal(item.category,'Uncategorized');
 assert.equal(item.requiresOwnershipConfirmation,true);
 assert.ok(item.recognitionReviewReasons.includes('manual_original_instance_review_required'));
 assert.match(item.localStatus,/original image|Nothing was automatically saved/i);
 assert.ok(recorded.renders>=2);
});
