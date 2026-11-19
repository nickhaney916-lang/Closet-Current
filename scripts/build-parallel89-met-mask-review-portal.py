"""Create an entirely OFFLINE true-source Met four-image mask review portal.

Run AFTER actual four JPEGs were independently fetched, full RGB SHA-256
verified, GrabCut source mask candidates, and exact original-photo boundary
triage completed. Only source-accurate original PNG, same-run masks, machine
overlay and original pixel ROI are embedded. No network, telemetry, remote
reviewer, product release or automatic expert approval.

The page lets a human PROPOSE correction polygons, annotate accept/reject for
specific uncertain regions, and export self-reported source-bound JSON for a
separate qualified reviewer to examine. A local click cannot lift HOLD.
"""
import base64
import hashlib
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/"research"/"parallel89"))
from met_review_handoff89 import (
 SOURCE_RGB_SHA,SOURCE_HEIGHTS,require_source_review_manifest,
 build_source_review_packet)

REVIEW=ROOT/"benchmark"/"parallel89-met70759-boundary-review-UNAPPROVED"
RGB=ROOT/"benchmark"/"parallel89-met70759-four-photo-research"
MASK=ROOT/"benchmark"/"parallel89-met70759-full-alpha-proposals"
OUT=ROOT/"benchmark"/"parallel89-met70759-OFFLINE-boundary-review-HOLD"
OUT.mkdir(parents=True,exist_ok=True)
report_file=REVIEW/"met-70759-four-photo-BOUNDARY-REVIEW-QUEUE.json"
report=json.loads(report_file.read_text(encoding="utf-8"))
verified=require_source_review_manifest(report)
packet=build_source_review_packet(report)
photos=[]
for photo_id,rec in sorted(verified.items()):
    p=RGB/f"met-70759-gallery-{photo_id}.rgb"
    raw=p.read_bytes()
    if (len(raw)!=1200*SOURCE_HEIGHTS[photo_id]*3 or
        hashlib.sha256(raw).hexdigest()!=SOURCE_RGB_SHA[photo_id]):
        raise ValueError("true-original-museum-image-decoded-RGB-attestation-failed")
    rgb=np.frombuffer(raw,dtype=np.uint8).reshape(
      (SOURCE_HEIGHTS[photo_id],1200,3))
    mfile=MASK/f"met-70759-{photo_id}-AUTO-UNREVIEWED-foreground-mask.png"
    candidate=cv2.imread(str(mfile),cv2.IMREAD_UNCHANGED)
    if (candidate is None or candidate.shape!=(SOURCE_HEIGHTS[photo_id],1200) or
        candidate.dtype!=np.uint8 or
        not np.isin(candidate,[0,255]).all() or
        hashlib.sha256(candidate.tobytes()).hexdigest()!=rec["originalMaskCoreSHA256"]):
        raise ValueError("original-core-mask-not-byte-identical-to-verified-review-receipt")
    overlayfile=REVIEW/f"met-{photo_id}-SOURCE-BOUNDARY-REVIEW-NEEDED.png"
    overlay=cv2.imread(str(overlayfile),cv2.IMREAD_COLOR)
    if overlay is None or overlay.shape!=rgb.shape:
        raise ValueError("source-original-pixel-boundary-overlay-missing")
    # PNG is LOSSLESS so the browser receives exact true source RGB, not an
    # untracked JPEG encoding with a different color transform.
    _,originalPNG=cv2.imencode(".png",cv2.cvtColor(rgb,cv2.COLOR_RGB2BGR))
    _,overlayPNG=cv2.imencode(".png",overlay)
    _,maskPNG=cv2.imencode(".png",candidate)
    photos.append({
      "imageId":photo_id,
      "sourceOriginalDecodedRGBSHA256":SOURCE_RGB_SHA[photo_id],
      "sourceCandidateCoreMaskSHA256":rec["originalMaskCoreSHA256"],
      "originalSourceLosslessPNG":"data:image/png;base64,"+
        base64.b64encode(originalPNG.tobytes()).decode("ascii"),
      "sourceBoundaryResearchOverlayPNG":"data:image/png;base64,"+
        base64.b64encode(overlayPNG.tobytes()).decode("ascii"),
      "sourceConservativeCandidateMaskPNG":"data:image/png;base64,"+
        base64.b64encode(maskPNG.tobytes()).decode("ascii"),
      "sourcePhotoAndMaskStillUnreviewed":True
    })
packet["embeddedOriginalSourcePhotoAssets"]=photos
packet["researchOnlyHumanReviewExportSchema"]=(
 "M2-met70759-original-photo-boundary-review-proposal/v1")
payload=json.dumps(packet,separators=(",",":"),ensure_ascii=True).replace(
 "<","\\u003c").replace("&","\\u0026")
template=r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none';">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Met 70759 — original photo garment boundary review (UNAPPROVED)</title>
<style>
:root{font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;color:#17212c;background:#f0f3f7}
*{box-sizing:border-box}body{margin:0 auto;max-width:1280px;padding:20px}
header{background:#163146;color:white;padding:22px;border-radius:12px;margin-bottom:14px}
h1{font-size:1.5rem;margin:0 0 8px}h2{font-size:1.1rem;margin:8px 0}
p{line-height:1.45}header p{margin:0;color:#dfebf7}
main{display:grid;grid-template-columns:minmax(280px,320px) minmax(0,1fr);gap:16px}
aside,section{background:white;padding:16px;border:1px solid #d7dfe7;border-radius:12px}
label{display:block;font-weight:600;margin:10px 0 4px}
select,input,textarea,button{font:inherit}select,input,textarea{width:100%;padding:9px;border:1px solid #aebbc8;border-radius:7px}
textarea{min-height:100px}button{background:#174f7c;color:#fff;border:0;border-radius:7px;padding:10px 14px;cursor:pointer;margin:4px 2px}
button:focus,select:focus,input:focus,textarea:focus{outline:3px solid #a6ceec}
button.secondary{background:#657384}.warn{color:#7d3509;font-weight:700}
.note{color:#455664;font-size:.9rem}.mono{font:12px ui-monospace,monospace;word-break:break-all}
.canvases{display:flex;flex-wrap:wrap;gap:12px}
.canvascol{flex:1 1 300px;min-width:0}
canvas{max-width:100%;display:block;border:1px solid #b7c4d0;background:#eee;cursor:crosshair}
.status{padding:9px;border:1px solid #bcc9d6;background:#f5f8fa;border-radius:8px;margin:10px 0;min-height:40px}
fieldset{border:1px solid #d2dbe4;border-radius:8px;margin-top:10px}
footer{margin-top:14px;color:#52606d;font-size:.85rem}
@media(max-width:850px){main{grid-template-columns:1fr}}
</style>
</head><body>
<header>
<h1>Met 1983.21a,b — garment boundary review packet</h1>
<p>OFFLINE • ORIGINAL PIXEL SOURCE LOCKED • AUTO-UNREVIEWED • NO 3D / NO RELEASE</p>
</header>
<main>
<aside>
<h2>Original photo evidence</h2>
<label for="photo">Photograph</label><select id="photo"></select>
<label for="region">Machine-disputed original-image region</label><select id="region"></select>
<p id="coords" class="note"></p>
<p id="hash" class="mono"></p>
<p class="warn">Only photo 2551406 is museum-captioned “a) front.” All other part/side labels are provisional.</p>
<h2>Proposed annotation (not approval)</h2>
<label for="decision">Proposed interpretation</label>
<select id="decision">
<option value="">Not reviewed</option>
<option value="retain_excluded_background">Retain excluded — likely background</option>
<option value="propose_add_garment_fabric">Propose include — possible garment fabric</option>
<option value="uncertain_request_more_evidence">Uncertain — request more evidence</option>
<option value="request_manual_redraw">Request redraw of boundary</option>
</select>
<label for="comment">Source-visible reasoning</label>
<textarea id="comment" placeholder="Describe the edge, garment texture, or why this remains uncertain."></textarea>
<label for="reviewer">Reviewer label (self-reported; not identity verification)</label>
<input id="reviewer" maxlength="100" placeholder="Optional local label">
<fieldset><legend>Correction polygon</legend>
<p class="note">For proposed addition or redraw, click at least three points inside the disputed bounding box or 35 pixels beyond it. Polygon coordinates are saved in original source image pixels.</p>
<button id="undo" class="secondary">Undo point</button><button id="clear" class="secondary">Clear polygon</button>
<p id="pointCount" class="note">0 points</p>
</fieldset>
<button id="save">Save this proposed decision</button>
<button id="export">Export source-locked JSON</button>
<div id="status" role="status" class="status">No decisions saved. Original mask is unchanged.</div>
<p class="note" id="progress">0 regions annotated</p>
</aside>
<section>
<h2>Original source versus machine boundary overlay</h2>
<p class="note">Left is exact decoded original RGB shown losslessly; right is the machine overlay. Green = conservative mask edge; orange = pale uncertainty; purple = chromatic uncertainty. These overlays are not human labels.</p>
<div class="canvases">
<div class="canvascol"><h2>Source photo — draw polygon here</h2><canvas id="original" aria-label="Original photograph crop; click to add correction polygon"></canvas></div>
<div class="canvascol"><h2>Automated uncertainty overlay</h2><canvas id="overlay" aria-label="Mask uncertainty cropped from original photograph"></canvas></div>
</div>
<h2>Safety / source provenance</h2>
<p id="metrics" class="note"></p>
<p class="warn">Exported JSON is a proposed review only. It cannot authenticate a qualified reviewer, change a garment mask, approve 3D clothing, lift Family Alpha HOLD #255, merge code, or deploy.</p>
</section>
</main>
<footer>Source: The Metropolitan Museum of Art, object 70759. No network access, tracking, uploads or persistent browser storage. Original Honolulu artifact 5152.1 is unrelated.</footer>
<script id="source-packet" type="application/json">__PACKET__</script>
<script>
"use strict";
const packet=JSON.parse(document.getElementById("source-packet").textContent);
const photos=new Map(packet.images.map(x=>[x.imageId,x]));
const assets=new Map(packet.embeddedOriginalSourcePhotoAssets.map(x=>[x.imageId,x]));
const regions=new Map();
packet.images.forEach(img=>img.regions.forEach(r=>regions.set(r.id,r)));
const answers=new Map(), loaded=new Map(), byId=id=>document.getElementById(id);
let current=null,vertices=[],crop=null;
function status(t){byId("status").textContent=t;}
function makeImage(src){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});}
async function loadPhoto(id){
 if(!loaded.has(id)){
  const a=assets.get(id);
  loaded.set(id,await Promise.all([makeImage(a.originalSourceLosslessPNG),makeImage(a.sourceBoundaryResearchOverlayPNG)]));
 }
 return loaded.get(id);
}
function range(r,img){
 const b=r.bboxOriginalPixels,pad=65;
 const x=Math.max(0,b[0]-pad),y=Math.max(0,b[1]-pad);
 const rx=Math.min(img.width,b[2]+pad+1),ry=Math.min(img.height,b[3]+pad+1);
 return {x,y,w:rx-x,h:ry-y};
}
async function render(){
 if(!current)return;
 const r=regions.get(current),image=photos.get(r.imageId);
 const [source,over]=await loadPhoto(r.imageId);crop=range(r,image);
 const sc=Math.min(700/crop.w,480/crop.h),w=Math.max(1,Math.round(crop.w*sc)),
  h=Math.max(1,Math.round(crop.h*sc));
 for(const [name,img] of [["original",source],["overlay",over]]){
  const canvas=byId(name);canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext("2d");
  ctx.drawImage(img,crop.x,crop.y,crop.w,crop.h,0,0,w,h);
  const [x0,y0,x1,y1]=r.bboxOriginalPixels;
  ctx.strokeStyle="#ffff00";ctx.lineWidth=2;ctx.setLineDash([6,4]);
  ctx.strokeRect((x0-crop.x)*w/crop.w,(y0-crop.y)*h/crop.h,
   (x1-x0+1)*w/crop.w,(y1-y0+1)*h/crop.h);
  ctx.setLineDash([]);
  if(name==="original"){
   ctx.strokeStyle="#d91f61";ctx.fillStyle="#d91f61";ctx.lineWidth=3;
   if(vertices.length){ctx.beginPath();vertices.forEach((p,i)=>{
    const px=(p[0]-crop.x)*w/crop.w,py=(p[1]-crop.y)*h/crop.h;
    if(!i)ctx.moveTo(px,py);else ctx.lineTo(px,py);
   });ctx.stroke();
   vertices.forEach(p=>ctx.fillRect((p[0]-crop.x)*w/crop.w-3,(p[1]-crop.y)*h/crop.h-3,6,6));}
  }
 }
 byId("pointCount").textContent=vertices.length+" original-pixel polygon points";
}
function count(){byId("progress").textContent=answers.size+" / "+regions.size+" regions annotated (not approved)";}
async function openRegion(id){
 if(!regions.has(id))return;
 current=id;
 const r=regions.get(id),p=photos.get(r.imageId);
 const a=answers.get(id);vertices=a?a.polygonOriginalPixels.map(x=>[...x]):[];
 byId("decision").value=a?.decision||"";
 byId("comment").value=a?.comment||"";
 byId("coords").textContent="Region "+id+" · x/y "+r.bboxOriginalPixels.join(", ")+" · "+r.disputedPixelCount+" disputed pixels; "+r.possibleChromaticFabricPixels+" colored; "+r.paleBackgroundOrWaistbandPixels+" pale";
 byId("hash").textContent="Source RGB SHA-256 "+p.originalFullDecodedRGBSHA256+" · candidate mask "+p.originalMaskCoreSHA256;
 byId("metrics").textContent="Original "+p.width+"×"+p.height+" pixels. Museum caption: "+(p.museumVerifiedExactCaption||"not independently verified")+". Decisions bind to this exact photo and mask, not the original Honolulu garment.";
 await render();
}
function populateRegions(){
 const id=Number(byId("photo").value),image=photos.get(id),sel=byId("region");
 sel.replaceChildren();
 image.regions.forEach(r=>{
  const opt=document.createElement("option");opt.value=r.id;
  opt.textContent=r.id+" — "+r.disputedPixelCount+" disputed pixels";sel.appendChild(opt);
 });
 if(image.regions.length)openRegion(image.regions[0].id);
}
byId("original").addEventListener("click",event=>{
 if(!current||!crop)return;
 const c=byId("original"),rect=c.getBoundingClientRect(),r=regions.get(current);
 const x=Math.round(crop.x+(event.clientX-rect.left)*crop.w/rect.width);
 const y=Math.round(crop.y+(event.clientY-rect.top)*crop.h/rect.height);
 const [x0,y0,x1,y1]=r.bboxOriginalPixels;
 if(x<x0-35||x>x1+35||y<y0-35||y>y1+35){
  status("Polygon points must stay within the original source review region (±35 px).");return;
 }
 if(vertices.length>=500){status("Maximum 500 polygon points.");return;}
 vertices.push([x,y]);render();
});
byId("undo").addEventListener("click",()=>{vertices.pop();render();});
byId("clear").addEventListener("click",()=>{vertices=[];render();});
byId("save").addEventListener("click",()=>{
 if(!current)return;
 const decision=byId("decision").value,comment=byId("comment").value.trim(),r=regions.get(current);
 if(!["retain_excluded_background","propose_add_garment_fabric",
      "uncertain_request_more_evidence","request_manual_redraw"].includes(decision)){
  status("Choose a proposed interpretation first.");return;
 }
 if(comment.length>2500){status("Comments are limited to 2,500 characters.");return;}
 if(["propose_add_garment_fabric","request_manual_redraw"].includes(decision)&&
   (vertices.length<3||!comment)){
  status("Proposed fabric additions or redraws require at least 3 original-pixel polygon points and a written reason.");return;
 }
 answers.set(current,{
  regionId:current,imageId:r.imageId,
  originalRGBSHA256:r.sourceOriginalRGBSHA256,
  originalMaskSHA256:r.originalMaskCoreSHA256,
  bboxOriginalPixels:r.bboxOriginalPixels,
  decision,comment,polygonOriginalPixels:vertices.map(x=>[...x])
 });
 status("Saved proposed interpretation for "+current+". No original pixels or masks changed.");
 count();
});
byId("export").addEventListener("click",()=>{
 if(!answers.size){status("Save at least one proposed review decision first.");return;}
 const payload={
  schema:"M2-met70759-original-photo-boundary-review-proposal/v1",
  sourceMuseumObjectNumber:"1983.21a, b",
  proposedRegionDecisions:Array.from(answers.values()),
  selfReportedReviewerLabel:byId("reviewer").value.slice(0,100),
  exportLocalTimestamp:new Date().toISOString(),
  provenanceOnlyNotQualifiedIdentityVerification:true,
  qualifiedReviewerVerified:false,sourceMaskHumanApproved:false,
  reviewProposalNotAppliedToSourceMask:true,
  originalSourcePhotoAndCandidateMaskImmutable:true,
  originalHonolulu5152_1NotCalibrated:true,
  consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:"HOLD"
 };
 const b=new Blob([JSON.stringify(payload,null,2)+"\n"],{type:"application/json"});
 const url=URL.createObjectURL(b);
 const link=document.createElement("a");
 link.href=url;link.download="met-70759-source-photo-review-PROPOSED-NOT-APPROVED.json";
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 status("Exported local proposed corrections, not expert verification or mask approval.");
});
byId("photo").addEventListener("change",populateRegions);
byId("region").addEventListener("change",()=>openRegion(byId("region").value));
(async()=>{
 const sel=byId("photo");
 packet.images.forEach(img=>{
  const o=document.createElement("option");
  o.value=String(img.imageId);o.textContent=String(img.imageId)+" — "+
    (img.museumVerifiedExactCaption||"view not verified");
  sel.appendChild(o);
 });
 sel.value="2551406";populateRegions();count();
})();
</script>
</body></html>"""
html=template.replace("__PACKET__",payload)
if ("__PACKET__" in html or "data:image/png;base64," not in html or
    'sourceMaskHumanApproved:false' not in html or
    'connect-src \'none\'' not in html):
    raise RuntimeError("offline-review-portal-safety-contract-invalid")
(OUT/"met-70759-OFFLINE-review-source-locked-UNAPPROVED.html").write_text(
 html,encoding="utf-8")
manifest={
 "schema":"M2-met70759-offline-source-review-packet-build/v1",
 "sourceMuseumObjectNumber":"1983.21a, b",
 "officialMetObjectPage":packet["sourceOriginalCollectionPage"],
 "originalPhotoSourceDIGESTs":[x["originalFullDecodedRGBSHA256"] for x in packet["images"]],
 "conservativeSourceMaskSHA256s":[x["originalMaskCoreSHA256"] for x in packet["images"]],
 "qualifiedExternalBoundaryApprovalReceived":False,
 "sourceIndependentOnlyCaption":"2551406 a) front",
 "machineRegionCount":sum(len(x["regions"]) for x in packet["images"]),
 "localHtmlSHA256":hashlib.sha256(html.encode("utf-8")).hexdigest(),
 "sourceOriginalRGBReencodedLosslesslyForDisplay":True,
 "noWebRequestsOrUploads":True,
 "sourceOnlyHumanAnnotationProposalNotTrustedMask":True,
 "originalHonolulu5152_1PhotoUnaffected":True,
 "consumer3DAdmitted":False,"releaseAuthorized":False,"familyAlpha":"HOLD"
}
(OUT/"met-70759-offline-review-packet-original-source-provenance.json").write_text(
 json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
print("M2_MET_GENUINE_OFFLINE_BOUNDARY_CORRECTION_PORTAL_HOLD "+json.dumps({
 "fourRealSourcePhotoAssets":len(photos),
 "sourceBoundReviewRegions":manifest["machineRegionCount"],
 "losslessOriginalSourceDisplay":True,
 "allHumanCorrectionsStillPending":True,
 "offlineLocalOnly":True,
 "humanApproved":False,"consumer3DAdmitted":False,"familyAlpha":"HOLD"
},sort_keys=True))
