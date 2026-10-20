#!/usr/bin/env python3
"""Stage model-blind real-photo annotation work. NEVER import or approve masks.

All source photos are exact previously licensed benchmark originals. The existing
human annotation and distinct-person approval editors are bundled unchanged;
their strict original-pixel review grid is bounded; draft human reviews are not approvals. Only this separate,
read-only packet is emitted. No user images or network requests are involved.
"""
import argparse
import hashlib
import html
import json
import shutil
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
DEFAULT='artifacts/independent-mask-review'
ANNOTATOR='benchmark/annotate-garment-native.html'
APPROVER='benchmark/approve-garment-mask-native.html'

def sha(data):return hashlib.sha256(data).hexdigest()
def stable(data):return json.dumps(data,indent=2,ensure_ascii=False)+'\n'
def text(value):return html.escape(str(value),quote=True)

def stage(destination=DEFAULT):
 out=(ROOT/destination).resolve()
 if not out.is_relative_to((ROOT/'artifacts').resolve()):
  raise ValueError('Review packet must remain under artifacts/')
 manifest=json.loads((ROOT/'benchmark/local-fitting-real-photo-manifest.json').read_text())
 locked=json.loads((ROOT/'benchmark/locked-photo-sources.json').read_text())
 registry=json.loads((ROOT/'benchmark/reference-mask-evidence/registry.json').read_text())
 if manifest.get('independentlyApprovedMasks')!=0 or registry.get('references')!=[]:
  raise ValueError('Nonempty approval evidence requires manual, separate review')
 rows=manifest['cases'];locked_by_id={r['id']:r for r in locked}
 if len(rows)!=12 or len({r['id']for r in rows})!=12:
  raise ValueError('Expected exactly twelve distinct locked real photos')
 if any(r.get('review') or r.get('independentReferenceMask') for r in rows):
  raise ValueError('Human approval found unexpectedly; packet must not promote it')
 out.mkdir(parents=True,exist_ok=True)
 originals=out/'originals';originals.mkdir(exist_ok=True)
 for editor,dest in [(ANNOTATOR,'FIRST-ANNOTATE.html'),(APPROVER,'SECOND-APPROVE.html')]:
  shutil.copyfile(ROOT/editor,out/dest)
 originals_info=[];rights=[];first_cards=[];second_cards=[]
 for row in rows:
  id=row['id'];filename=row['image'];locked_record=locked_by_id.get(id)
  if (not locked_record or locked_record['image']!=filename or
      not filename.startswith('commons-') or '/'in filename or '\\'in filename or
      not filename.endswith('.jpg')):
   raise ValueError('Invalid source locator: '+id)
  data=(ROOT/'benchmark/fixtures'/filename).read_bytes()
  expected=row['sourceSha256']
  if sha(data)!=expected or sha(data)!=locked_record['sha256']:
   raise ValueError('Original source photo hash mismatch: '+id)
  with Image.open(ROOT/'benchmark/fixtures'/filename) as picture:
   picture.verify()
  with Image.open(ROOT/'benchmark/fixtures'/filename) as picture:
   width,height=picture.size
  if min(width,height)<200 or max(width,height)>12000:
   raise ValueError('Unexpected dimensions: '+id)
  (originals/filename).write_bytes(data)
  a=locked_record['attribution']
  if not all(k in a for k in ('title','source','license','author')):
   raise ValueError('Missing source rights/attribution: '+id)
  # This blind roster MUST NOT include manifest's category, visibleFeatures,
  # risk summary, prediction, mask proposal or expectedDisposition.
  public={'id':id,'image':filename,'sourceSha256':expected,'width':width,'height':height,
          'sourceRelativePath':'originals/'+filename,'firstReviewState':'not-started',
          'approvedReferenceMask':None}
  originals_info.append(public)
  rights.append({'id':id,'sourceSha256':expected,'attribution':a,
                 'redistributionApprovalIndependentlyChecked':False,
                 'reviewerMayNotInferCommercialRightsFromSourceLabel':True})
  first_cards.append('<article><figure><img loading="lazy" src="'+text(public['sourceRelativePath'])+
   '" alt="Original clothing photograph '+text(id)+'"></figure><div><h2>'+text(id)+
   '</h2><p>Original '+str(width)+' × '+str(height)+' · <strong>NOT ANNOTATED</strong></p>'+
   '<a href="'+text(public['sourceRelativePath'])+'" download="'+text(filename)+'">Use exact original JPG</a>'+
   '<p>Open FIRST-ANNOTATE.html, load this JPG, select independent physical garment (blank first mask), draw the original-pixel outline for each visible item separately, and export a DRAFT JSON. No AI proposal is supplied.</p></div></article>')
  second_cards.append('<article><h2>'+text(id)+' — HOLD</h2>'+
   '<p>'+text(row['sourceInspection'])+'</p>'+
   '<p>Independent reviewer checks garment ID/category/form, cuffs, seams, hems, trim, body and mannequin contamination, and any ambiguity. Re-check full-resolution original.</p>'+
   '<p>External image provenance: <a href="'+text(a['source'])+'">'+text(a['title'])+'</a>; '+text(a['license'])+
   '. Human review and distribution rights still require separate evidence.</p></article>')
 (out/'BLIND-FIRST-SOURCES.json').write_text(stable({'schemaVersion':1,
  'purpose':'model-blind-first-human-garment-boundary-review',
  'sourceOriginals':originals_info,'approvedMasks':0,'modelPredictionsIncluded':0,
  'manifestCategoryLabelsIncluded':0,'firstReviewCompleted':0,
  'sourcePixelsPreserved':True,'currentEditorOutputsExactOriginalGrid':False}))
 (out/'RIGHTS-AUDIT.json').write_text(stable({'schemaVersion':1,'sourceRightsNotAutomaticallyApproved':True,'photos':rights}))
 (out/'REVIEW-STATUS.json').write_text(stable({'schemaVersion':1,
  'label':'HOLD — no independent human outline approvals',
  'actualLicensedOriginalHashesVerified':len(rows),'originalsInPacket':len(rows),
  'annotationEditorNativePixelLimit':12000000,
  'annotationEditorNativeSideLimit':6000,
  'annotationEditorNativeDetailViewOnly':False,
  'currentEditorOutputsExactOriginalGrid':True,
  'independentlyReviewedFullSizeReferenceMasks':0,
  'referenceImporterImplemented':False,'humanReviewerOneCompleted':0,
  'humanReviewerTwoApproved':0,'evaluatedRealMaskQualityPasses':0,
  'productionAuthorized':False,'independentRightsApproval':False,
  'sourcePixelsPreserved':True,'modelProposalsAvailableInFirstPacket':0,
  'originalsHashSetSha256':sha(stable(originals_info).encode()),
  'annotationEditorSha256':sha((ROOT/ANNOTATOR).read_bytes()),
  'secondReviewerEditorSha256':sha((ROOT/APPROVER).read_bytes()),
  'remainingBlockers':['first human must independently label the garment on exact original raster for evaluator',
   'second unrelated reviewer must inspect full visible fabric and all holes',
   'human-supplied rights/review evidence and reference importer are still absent',
   'native-grid human drafts are unapproved; reviewer provenance, rights evidence and importer remain absent',
   'binary masks cannot certify transparency, skin occlusion or realistic fit']}))
 style='body{font:16px system-ui;margin:0 auto;padding:24px;max-width:1100px;background:#f8f7fa;color:#24212b}a{color:#4c3279}article{display:flex;gap:16px;align-items:start;padding:16px;background:white;margin:16px 0;border:1px solid #ddd;border-radius:12px}img{max-width:220px;max-height:300px;object-fit:contain}figure{margin:0;flex:0 0 230px}p{line-height:1.5}header{background:#e8e5eb;padding:15px;border-radius:10px}.hold{font-weight:700;color:#7d420b}'
 first='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>First review — 12 original garment photographs</title><style>'+style+'</style><header><h1>First human review · 12 original photos</h1><p class="hold">HOLD: no human garment masks have been approved.</p><p>Model-blind sources only: source pixels are copied without modification. Use the <a href="FIRST-ANNOTATE.html">human drawing editor</a> starting from a blank mask for each independently identified garment. Export drafts and arrange a DIFFERENT second reviewer. Do not infer category from a model or file title.</p><p><strong>Original-resolution review:</strong> the new offline editor draws on the full photo pixel lattice (limit 12 million pixels / 6000 pixels per side) and refuses larger sources rather than upscaling. These are human DRAFTS until a distinct independent reviewer checks the whole garment and legally reviewed evidence is imported.</p></header>'+''.join(first_cards)+'</html>'
 second='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Second independent review — twelve source images</title><style>'+style+'</style><header><h1>Second independent reviewer · quality checklist</h1><p class="hold">All 12 remain HOLD. Do not mark model predictions as truth.</p><p>Only open this page after reviewer one has independently annotated the original source without predictions. Use <a href="SECOND-APPROVE.html">the separate second-review editor</a> with the original photo and their draft. A human sign-off is NOT authenticated reviewer identity, independent annotation and image redistribution rights proof, evaluator registration, production authorization or photorealism proof. Reference importer still requires explicitly reviewed implementation and provenance.</p></header>'+''.join(second_cards)+'</html>'
 (out/'FIRST-REVIEW.html').write_text(first)
 (out/'SECOND-REVIEW.html').write_text(second)
 print(stable({'originals':len(rows),'sourceHashesVerified':len(rows),'independentFullMasks':0,
  'maskQualityPasses':0,'reviewerOneFinished':0,'reviewerTwoApproved':0,
  'sourcePhotoPixelsModified':False,'modelMasksSeeded':0,'productionAuthorized':False}))

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--out',default=DEFAULT)
 args=parser.parse_args();stage(args.out)
