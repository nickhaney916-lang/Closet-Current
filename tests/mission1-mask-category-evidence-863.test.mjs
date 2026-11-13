/** P863 fail-closed isolated-garment cross-view evidence tests.
 * Generated synthetic score fixtures test admission policy only. No real model
 * inference, independent human labels, model accuracy, phones or cloud.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {classifyIsolatedGarment} from "../public/recognition-engine.mjs";
import {evaluateMission1Evidence} from "../scripts/m1-release-evidence-851.mjs";
const photo={width:300,height:420};
const mask=(category="Bottoms",confidence=.98)=>({
 categories:[category],types:[],confidence,clipped:false
});
const positive=[
 {label:"a pair of shorts",score:.22},
 {label:"a skirt",score:.20},
 {label:"a blouse",score:.25},
 {label:"a T-shirt",score:.12},
 {label:"a blank wall",score:.21}
];
const view=rows=>async()=>structuredClone(rows);
test("P863 mask-only Unknown needs BOTH views to favor the SAME garment broad category",async()=>{
 const identified=[];
 const actual=await classifyIsolatedGarment(view(positive),photo,{
  hint:mask(),confirmationModel:view(positive),onIdentified:c=>identified.push(c)});
 assert.equal(actual.strong,false);
 assert.equal(actual.categoryConfirmed,true);
 assert.equal(actual.categoryOnly,true);
 assert.equal(actual.reason,"mask_category_type_review");
 assert.equal(actual.choices[0].category,"Bottoms");
 assert.equal(actual.choices[0].itemType,"Unknown");
 assert.deepEqual(actual.details,{});
 assert.deepEqual(identified,[]);
});
test("P863 nonclothing votes cannot be converted into clothing by a high-confidence mask",async()=>{
 const negatives=[
  [{label:"a blank wall",score:.94},{label:"a dog or cat",score:.06}],
  [{label:"a pair of shorts",score:.12},{label:"a skirt",score:.08},
   {label:"a blurry image with no identifiable garment",score:.8}],
  [{label:"a pair of shorts",score:.30},{label:"a skirt",score:.08},
   {label:"a blank wall",score:.6},{label:"a blouse",score:.02}],
  [{label:"a blouse",score:.51},{label:"a casual dress",score:.30},
   {label:"a pair of shorts",score:.09},{label:"a blank wall",score:.10}]
 ];
 for(const rows of negatives){
  for(const [a,b] of [[rows,rows],[positive,rows],[rows,positive]]){
   const identified=[];
   const result=await classifyIsolatedGarment(view(a),photo,{
    hint:mask(),confirmationModel:view(b),onIdentified:c=>identified.push(c)});
   assert.equal(result.strong,false);
   assert.equal(result.choices.length,0);
   assert.equal(result.categoryConfirmed===true,false);
   assert.equal(result.reason,"mask_category_disagrees");
   assert.deepEqual(identified,[]);
  }
 }
});
test("P863 strong model-backed non-risky subtype still identifies; mask-only Never strong",async()=>{
 const scores=[{label:"sneakers",score:.86},{label:"ankle boots",score:.09},
  {label:"a blurry image with no identifiable garment",score:.05}];
 const seen=[];
 const outcome=await classifyIsolatedGarment(view(scores),photo,{
  hint:mask("Shoes"),confirmationModel:view(scores),
  onIdentified:choice=>seen.push(choice.itemType)});
 assert.equal(outcome.strong,true);
 assert.equal(outcome.choices[0].itemType,"Sneakers");
 assert.deepEqual(seen,["Sneakers"]);
 const weak=await classifyIsolatedGarment(view(positive),photo,{
  hint:mask("Bottoms",.85),confirmationModel:view(positive)});
 assert.equal(weak.strong,false);
 assert.equal(weak.choices.length,0);
});
test("P863 source/report and unchanged owner review release gate remain fail closed",async()=>{
 const [app,worker,source,report]=await Promise.all([
  readFile("public/app.js","utf8"),readFile("public/local-worker.mjs","utf8"),
  readFile("public/recognition-engine.mjs","utf8"),
  readFile("research/mission1-mask-category-evidence-863/REPORT.md","utf8")
 ]);
 assert.match(app,/^const reviewFirst836=true;$/m);
 assert.match(worker,/if\(result\.strong\)\{/);
 assert.match(source,/supportsMaskCategory\(a,whole\)/);
 assert.match(source,/supportsMaskCategory\(b,close\)/);
 assert.match(report,/Family Alpha HOLD #255 OPEN/);
 const release=evaluateMission1Evidence(null);
 assert.equal(release.status,"BLOCKED");
 assert.equal(release.shouldLiftFamilyAlphaHold,false);
});
