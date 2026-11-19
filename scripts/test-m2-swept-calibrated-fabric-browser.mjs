/**
 * Mission 2 research-only native browser calculation.
 * The original public museum garment is deliberately NOT represented by this
 * synthetic cloth canvas; no photographed garment or fitted wearable claim.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';

const engine=process.env.M2_BROWSER||'chromium';
assert.ok(['chromium','webkit'].includes(engine));
const file=resolve('research/parallel89/swept-contact-calibrated-fabric89.mjs');
const core=resolve('research/parallel89/full-indexed-contact-calibration89.mjs');
const html='<!doctype html><meta charset="utf-8"><title>M2 synthetic cloth only</title>'+
 '<style>body{font:16px sans-serif}canvas{max-width:100%;background:#eee}</style>'+
 '<h1>SYNTHETIC FABRIC RESEARCH — NOT CALIBRATED ORIGINAL PHOTO</h1>'+
 '<canvas width="640" height="400" id="cloth"></canvas>';
const server=createServer(async(req,res)=>{
 try{
  if(req.url==='/'){
   res.writeHead(200,{'content-type':'text/html; charset=utf-8'});
   res.end(html);return;
  }
  const path=req.url==='/research/parallel89/swept-contact-calibrated-fabric89.mjs'?
   file:req.url==='/research/parallel89/full-indexed-contact-calibration89.mjs'?
   core:null;
  if(!path){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':'text/javascript; charset=utf-8',
   'cache-control':'no-store'});
  res.end(await readFile(path));
 }catch(e){res.writeHead(500);res.end(String(e));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true});
 const page=await browser.newPage({viewport:{width:640,height:500}});
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');
 const proof=await page.evaluate(async()=>{
  const mod=await import('/research/parallel89/swept-contact-calibrated-fabric89.mjs');
  const tri=z=>[[0,0,z],[1,0,z],[0,1,z]];
  const contact=mod.evaluateSweptIndexedContact({
   frontStart:[tri(2)],frontEnd:[tri(-2)],
   bodyStart:[tri(0)],bodyEnd:[tri(0)],motionModel:'linear-vertex'
  });
  const unknownMotion=mod.evaluateSweptIndexedContact({
   frontStart:[tri(2)],frontEnd:[tri(-2)],
   bodyStart:[tri(0)],bodyEnd:[tri(0)],motionModel:'bone-rotation'
  });
  const cloth=mod.simulateResearchFabricPatch();
  const ctx=document.querySelector('#cloth').getContext('2d');
  ctx.lineWidth=2;ctx.strokeStyle='#222';
  const p=cloth.positionsM;
  const draw=(a,b)=>{
   ctx.beginPath();
   ctx.moveTo(85+a[0]*740,75+a[2]*330-(a[1]-1.2)*180);
   ctx.lineTo(85+b[0]*740,75+b[2]*330-(b[1]-1.2)*180);
   ctx.stroke();
  };
  for(let y=0;y<7;y++)for(let x=0;x<7;x++){
   const i=y*7+x;
   if(x<6)draw(p[i],p[i+1]);
   if(y<6)draw(p[i],p[i+7]);
  }
  ctx.fillStyle='#111';ctx.font='15px sans-serif';
  ctx.fillText('research-only gravity patch; no body, seams, or measured material',8,380);
  return {
   contactDecision:contact.decision,contactT:contact.witness?.t,
   unknownMotionDecision:unknownMotion.decision,
   pinned:cloth.pinnedEdgeUnchanged,minimumClothHeightM:cloth.minHeightM,
   sourceFabricCertified:cloth.originalPhotoSourceFabricBehaviorCertified,
   consumer3DAdmitted:cloth.consumer3DAdmitted,
   familyAlpha:cloth.familyAlpha
  };
 });
 assert.equal(proof.contactDecision,'BLOCKED_OBSERVED_SWEPT_CONTACT');
 assert.equal(proof.contactT,.5);
 assert.equal(proof.unknownMotionDecision,'BLOCKED_MOTION_BOUND_UNPROVEN');
 assert.equal(proof.pinned,true);
 assert.ok(proof.minimumClothHeightM<1.198);
 assert.equal(proof.sourceFabricCertified,false);
 assert.equal(proof.consumer3DAdmitted,false);
 assert.equal(proof.familyAlpha,'HOLD');
 assert.deepEqual(errors,[]);
 const out='benchmark/m2-p89-swept-contact-fabric-HOLD';
 await mkdir(out,{recursive:true});
 await writeFile(out+'/'+engine+'-synthetic-research-only.png',
  await page.locator('#cloth').screenshot());
 await writeFile(out+'/'+engine+'-negative-controls.json',
  JSON.stringify({engine,sourceMaterial:'SYNTHETIC_ONLY',...proof},null,2));
 console.log('M2_RESEARCH_ONLY_NATIVE_BROWSER_PASS '+JSON.stringify({engine,...proof}));
}finally{
 await browser?.close();await new Promise(resolve=>server.close(resolve));
}
