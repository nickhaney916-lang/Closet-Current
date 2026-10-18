"""Offline, source-verified reviewer handoff for the entire pinned photo suite.

The export includes actual original source bytes and UNAPPROVED model proposals.
It never creates, approves, or infers a garment-only reference mask.
"""
from hashlib import sha256
from html import escape
from pathlib import Path
from re import fullmatch
import json

MAX_SOURCE_BYTES=16_000_000

def make_complete_review_packet(review_dir,photos_dir,scenes,*,expected_count=10):
    """Validate ALL originals before copying anything into the review packet.

    "reviewFirst" prioritizes annotation order; it NEVER omits other photos.
    Every source remains the exact SHA-256-verified original JPEG.
    """
    root=Path(review_dir)
    src_root=Path(photos_dir)
    if (not isinstance(scenes,list) or len(scenes)!=expected_count or
        not 1<=expected_count<=25):
        raise ValueError("Incomplete independent photo review packet")
    checked=[]
    seen=set()
    for scene in scenes:
        if not isinstance(scene,dict):
            raise ValueError("Invalid photo review row")
        id=scene.get("id")
        if (not isinstance(id,str) or not fullmatch(r"(?:commons|validation)-[0-9]{4}",id)
            or id in seen or scene.get("image")!=id+".jpg"
            or not isinstance(scene.get("sourceSha256"),str)
            or not fullmatch(r"[0-9a-f]{64}",scene["sourceSha256"])
            or scene.get("allMasksUnapproved") is not True
            or scene.get("userPhotoModified") is not False
            or not isinstance(scene.get("candidateSeeds"),list)
            or scene.get("exactOriginalIncludedForReview") is not True
            or not isinstance(scene.get("reviewFirst"),bool)):
            raise ValueError("Unsafe or incomplete source-photo review identity")
        seen.add(id)
        for candidate in scene["candidateSeeds"]:
            if (not isinstance(candidate,dict)
                or not isinstance(candidate.get("id"),str)
                or not fullmatch(id+r"-candidate-[0-9]{2}",candidate["id"])
                or candidate.get("prediction")!=
                  "independent-outline-review/model-seeds/"+candidate["id"]+".prediction.json"
                or candidate.get("approvedReference") is not None
                or candidate.get("referenceStatus")!="pending-human-annotation"):
                raise ValueError("Unapproved candidate provenance mismatch")
        source=src_root/(id+".jpg")
        if not source.is_file():
            raise ValueError("Missing unchanged original: "+id)
        raw=source.read_bytes()
        if not 0<len(raw)<=MAX_SOURCE_BYTES or sha256(raw).hexdigest()!=scene["sourceSha256"]:
            raise ValueError("Original source SHA-256 mismatch: "+id)
        # The download script already verified JPEG decoding and licensing;
        # require actual JPEG framing again so renaming a PNG cannot pass.
        if not raw.startswith(b"\xff\xd8") or not raw.endswith(b"\xff\xd9"):
            raise ValueError("Original source is not JPEG: "+id)
        checked.append((scene,raw))
    # Every source passed. A failed packet cannot masquerade as partially complete.
    dest=root/"original-photos"
    dest.mkdir(parents=True,exist_ok=True)
    coverage=[]
    for scene,raw in checked:
        id=scene["id"];original=dest/(id+".jpg")
        original.write_bytes(raw)
        if sha256(original.read_bytes()).hexdigest()!=scene["sourceSha256"]:
            raise ValueError("Export original changed: "+id)
        coverage.append({
          "id":id,"image":scene["image"],"sha256":scene["sourceSha256"],
          "bytes":len(raw),"includedUnchanged":True,
          "priorityForHumanReview":scene["reviewFirst"],
          "modelProposalCount":len(scene["candidateSeeds"]),
          "independentlyApprovedMasks":0,"physicalGarmentCount":None
        })
    manifest={
      "status":"all-originals-verifiably-included-pending-independent-human-review",
      "sourcePhotoCount":len(coverage),"verifiedOriginalCount":len(coverage),
      "allOriginalSHA256Matched":True,"reviewPrioritySourceCount":sum(x["priorityForHumanReview"] for x in coverage),
      "modelProposalMasksAreGroundTruth":False,
      "independentlyApprovedGarmentMasks":0,
      "measuredPhysicalGarmentAccuracy":None,"canAutoSaveOrPromote":False,
      "sources":coverage
    }
    (root/"source-original-coverage.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf8")
    cards=[]
    for entry in sorted(checked,key=lambda item:(not item[0]["reviewFirst"],item[0]["id"])):
        scene,_=entry;id=scene["id"]
        parts=[
          '<section class="case">',
          '<h2>'+escape(id)+( ' · review first' if scene["reviewFirst"] else '')+'</h2>',
          '<img loading="lazy" alt="Unchanged source photograph '+escape(id)+'" src="original-photos/'+id+'.jpg">',
          '<p>Verified unchanged original · '+str(len(scene["candidateSeeds"]))+
          ' unapproved AI proposals. Physical garment count: <strong>not reviewed</strong>.</p>',
          '<p><a href="original-photos/'+id+'.jpg">Open original at full resolution</a> · '+
          '<a href="../'+id+'-instance-overlays.png">See model proposal overlay (not truth)</a></p>',
          '<details><summary>Optional model mask proposals — do not view before first independent review</summary>',
          '<ul>'
        ]
        for candidate in scene["candidateSeeds"]:
            item_id=candidate["id"]
            parts.append('<li><a href="model-seeds/'+item_id+'.prediction.json">'+
                         escape(item_id)+' — unapproved AI prediction</a></li>')
        parts.extend(['</ul></details></section>'])
        cards.append("\n".join(parts))
    index="""<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Closet Current — verified real-photo independent review queue</title>
<style>body{font:16px system-ui,sans-serif;max-width:1100px;margin:auto;padding:18px;color:#222}
header{max-width:850px}h1{font-size:1.75rem}h2{font-size:1.16rem}.cases{display:grid;
grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}.case{border:1px solid #aaa;
border-radius:12px;padding:16px}.case img{max-width:100%;max-height:390px;display:block;
margin:auto;object-fit:contain}a{color:#45219b}p{line-height:1.5}
details{border-top:1px solid #bbb;padding-top:10px}</style>
<header><h1>Original-photo garment review queue</h1>
<p><strong>Research only. All images are SHA-256-verified, unmodified licensed
originals. This page does not certify masks or identify individual garments.</strong></p>
<p>First reviewer: inspect each original WITHOUT opening AI proposals. Identify and
draw every physical garment, including layers, shoes, and clothing the model missed,
using the project's <code>benchmark/annotate-garment.html</code> (blank independent
physical garment mode). Second, different human reviewer: verify source, garment
identities and mask edges in <code>benchmark/approve-garment-mask.html</code>.
After both agree on the entire scene, assemble the reviewed masks with
<code>benchmark/assemble-physical-inventory.html</code> and run the separate
offline scoring script. Do not approve a garment based on the visual AI
overlay, use the proposal as truth, or send personal photos to a public site.</p>
<p>All listed files are internal review artifacts. No customer wardrobe uploads,
model deployment, automatic saves, paid AI, or accuracy certification.</p></header>
<main class="cases">"""+'\n'.join(cards)+"""</main></html>"""
    (root/"REVIEW-QUEUE.html").write_text(index,encoding="utf8")
    return manifest
