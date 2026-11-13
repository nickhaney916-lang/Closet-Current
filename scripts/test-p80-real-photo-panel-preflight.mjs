/**
 * Actual P80 subtype-panel-80.mjs quality preflight on THREE SHA-pinned public
 * development JPEGs, not generated geometric pictures.
 *
 * No model scores, signed owners, truth labels, saves or accuracy claims.
 * Exercises real browser pixel decode and REAL panel logic; the model callback
 * is an explicit spy that MUST NOT run for low-detail input.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, join } from "node:path";
import { chromium, webkit } from "playwright";

const ids = ["commons-0033", "commons-0041", "commons-0088"];
const locked = JSON.parse(await readFile("benchmark/locked-photo-sources.json","utf8"));
const manifest = JSON.parse(await readFile("benchmark/manifest-reviewed-32.json","utf8"));
const inputs = [];
for (const id of ids) {
  const row=locked.find(x=>x.id===id);
  const exposed=manifest.find(x=>x.id===id);
  assert.equal(row?.verified,true);
  assert.equal(exposed?.verified,true);
  assert.equal(exposed?.image,row.image);
  assert.ok(row.attribution.source.startsWith("https://commons.wikimedia.org/wiki/File:"));
  const bytes=await readFile(join("benchmark/photos",row.image));
  assert.equal(createHash("sha256").update(bytes).digest("hex"),row.sha256);
  assert.ok(bytes[0]===255&&bytes[1]===216);
  inputs.push({
    id, sha256:row.sha256,
    image:"data:image/jpeg;base64,"+bytes.toString("base64"),
    category:exposed.expectedCategory,
  });
}
assert.equal(inputs.length,3);
const root=resolve("public");
const server=createServer(async(req,res)=>{
  try {
    if(req.method!=="GET") throw Error("GET ONLY");
    const path=new URL(req.url,"http://localhost").pathname;
    if(path==="/"){
      res.setHeader("Content-Type","text/html");
      return res.end('<!doctype html><html lang="en"><head><title>Public-photo preflight only</title></head><body><main id="main"></main></body></html>');
    }
    const file=resolve(root,"."+decodeURIComponent(path));
    if(!file.startsWith(root+"/"))throw Error("BLOCKED PATH");
    const mime={".mjs":"text/javascript",".js":"text/javascript",".json":"application/json"};
    res.setHeader("Content-Type",mime[extname(file)]||"text/plain");
    return res.end(await readFile(file));
  } catch {
    res.statusCode=404;
    res.end("Missing");
  }
});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const origin="http://127.0.0.1:"+server.address().port;
const reports=[];
try {
  for(const engine of [chromium,webkit]){
    const browser=await engine.launch({
      headless:true,
      args:engine===chromium?["--no-sandbox"]:[],
    });
    try {
      for(const width of [320,390,430]){
        const page=await browser.newPage({viewport:{width,height:850}});
        page.setDefaultTimeout(25000);
        const errors=[],network=[];
        page.on("pageerror",e=>errors.push(e.message));
        page.on("request",r=>network.push({url:r.url(),method:r.method()}));
        try {
          await page.goto(origin);
          const result=await page.evaluate(async (photos)=>{
            const {mountSubtype80}=await import("/subtype-panel-80.mjs");
            const {hash80,jpeg80,revision80}=await import("/subtype-review-80.mjs");
            let modelRequests=0,saves=0,applied=0;
            const observations=[];
            for(const photo of photos){
              const originalBytes=jpeg80(photo.image);
              if(await hash80(originalBytes)!==photo.sha256)
                throw Error("Original byte digest disagrees with lock");
              const base=new Image();
              base.src=photo.image;
              await base.decode();
              for(const mode of ["dark-pixels","undersized","declared-clipped"]){
                const canvas=document.createElement("canvas");
                canvas.width=mode==="undersized"?96:320;
                canvas.height=mode==="undersized"?128:400;
                const ctx=canvas.getContext("2d",{willReadFrequently:true});
                if(mode==="declared-clipped") {
                  ctx.drawImage(base,base.naturalWidth*0.25,base.naturalHeight*0.25,
                    base.naturalWidth*0.5,base.naturalHeight*0.5,
                    0,0,canvas.width,canvas.height);
                } else ctx.drawImage(base,0,0,canvas.width,canvas.height);
                if(mode==="dark-pixels"){
                  ctx.fillStyle="rgba(0,0,0,0.96)";
                  ctx.fillRect(0,0,canvas.width,canvas.height);
                }
                const changed=canvas.toDataURL("image/jpeg",0.89);
                const item={
                  id:"SYNTHETIC-"+photo.id+"-"+mode,
                  image:photo.image,
                  originalPhoto:{image:photo.image},
                  recognitionPhoto:{image:changed},
                  category:photo.category,
                  itemType:"Unknown",
                  ...(mode==="declared-clipped"?{segmentHint:{clipped:true}}:{}),
                };
                const originalRevision=revision80(item);
                const freshHash=await hash80(jpeg80(changed));
                if(freshHash===photo.sha256)throw Error("Variant did not change input");
                const owner={id:"SYNTHETIC-PREFLIGHT-OWNER"};
                const form=document.createElement("form");
                form.id="synthetic-preflight";
                document.querySelector("main").replaceChildren(form);
                const panel=mountSubtype80({
                  form,item,
                  getOwner:()=>owner,
                  isLive:()=>true,
                  getCategory:()=>photo.category,
                  onChoose:()=>{applied++},
                  request:async()=>{modelRequests++;throw Error("MODEL MUST NOT START");},
                });
                const check=form.querySelector("fieldset button");
                const [consent,detail]=form.querySelectorAll('fieldset input[type="checkbox"]');
                if(!consent||!detail||!check)throw Error("Actual panel did not mount");
                consent.checked=true;
                consent.dispatchEvent(new Event("change",{bubbles:true}));
                detail.checked=true;
                detail.dispatchEvent(new Event("change",{bubbles:true}));
                await check.onclick();
                const status=form.querySelector('[role="status"]')?.textContent||"";
                if(!status.includes("No model comparison was requested"))
                  throw Error("Actual panel failed preflight for "+photo.id+" "+mode+": "+status);
                if(modelRequests!==0||saves!==0||applied!==0)
                  throw Error("Forbidden subtype model or mutation");
                if(revision80(item)!==originalRevision)throw Error("Panel mutated item");
                if(await hash80(jpeg80(item.originalPhoto.image))!==photo.sha256)
                  throw Error("Original JPEG changed");
                if(await hash80(jpeg80(item.recognitionPhoto.image))!==freshHash)
                  throw Error("Recognition input changed");
                if(!panel.valid())throw Error("Owner-source panel incorrectly invalidated");
                observations.push({
                  sourceId:photo.id,
                  variant:mode,
                  inputSideMinimum:Math.min(canvas.width,canvas.height),
                  modelRequested:false,
                  manualUnknownKept:item.itemType==="Unknown",
                  originalBytesPreserved:true,
                });
                panel.close();
                if(form.querySelector("fieldset"))throw Error("Panel not destroyed");
              }
            }
            return {
              cases:observations.length,
              realOriginalPhotos:photos.length,
              transformedInputs:observations.length,
              requestsToModel:modelRequests,
              saves,applied,
              independentlyHumanLabeled:false,
              sourceDisjointBlind:false,
              realModelInference:0,
              physicalDevices:0,
              subtypeAccuracy:null,
              observations,
            };
          },inputs);
          assert.equal(result.cases,9);
          assert.equal(result.requestsToModel,0);
          assert.equal(result.applied,0);
          assert.equal(result.saves,0);
          assert.equal(result.subtypeAccuracy,null);
          assert.deepEqual(errors,[]);
          assert.ok(network.every(r=>r.method==="GET"||r.method==="HEAD"));
          assert.ok(network.every(r=>r.url.startsWith(origin)||r.url.startsWith("data:")));
          reports.push({
            browser:engine.name(),
            viewportWidth:width,
            publicDevelopmentOriginals:result.realOriginalPhotos,
            transformations:result.transformedInputs,
            preflightWithoutModel:result.cases,
            inputOriginalHashesPreserved:true,
            externalRequests:0,
            modelRequests:0,
            accuracy:"UNKNOWN",
          });
        } finally {
          await page.close();
        }
      }
    } finally {
      await browser.close();
    }
  }
  assert.equal(reports.length,6);
  assert.equal(reports.reduce((n,r)=>n+r.preflightWithoutModel,0),54);
  console.log("P80_REAL_PHOTO_PANEL_PREFLIGHT "+JSON.stringify({
    kind:"REAL BROWSER PIXEL DECODE AND ACTUAL P80 UI, PUBLIC DEVELOPMENT PHOTOS, NO MODEL",
    cases:54,engines:2,viewports:[320,390,430],
    originalSources:3,transformationModes:["dark-pixels","undersized","declared-clipped"],
    noModelPreflight:54,originalShaVerified:true,originalsChanged:0,photosUploaded:0,
    sourceDisjointIndependentHumanLabels:0,physicalPhones:0,
    subtypeAccuracy:null,rows:reports,
  }));
} finally {
  server.closeAllConnections();
  await new Promise(r=>server.close(r));
}
