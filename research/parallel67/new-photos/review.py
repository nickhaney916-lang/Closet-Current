#!/usr/bin/env python3
"""Record pre-inference model-independent AI visual review; never human truth."""
import hashlib,json
from pathlib import Path
out=Path(__file__).resolve().parent
manifest=json.loads((out/'manifest.json').read_text())
rejected={3:'Pens, not a garment',4:'Logo artwork, not a garment photograph',5:'Crowd on a beach; no isolated sweatshirt',7:'Towels and closet scene; sweatshirt not isolated',8:'Performance by artist Earl Sweatshirt; not isolated apparel',9:'Embroidery equipment; not blouse photograph',11:'Same museum garment as 0012; excluded alternate view before inference',13:'Scanned illustration rather than real garment photograph',15:'Fragment detail without complete tunic silhouette',16:'Scanned narrow historical textile fragment; not complete garment',24:'Multiple visible outfit layers; no single-garment truth or instance masks',26:'Close view of same Marimekko dress as 0025; excluded same-object duplicate',29:'Microphone and monitor with person, not a clean garment-free negative'}
colors={1:'Blue',2:'Black',6:'Black',10:'White',12:'Beige',14:'Beige',17:'Gray',18:'Blue',19:'White',20:'Black',21:'Pink',22:'Brown',23:'Black',25:'Red',27:'Multicolor',28:'Multicolor'}
reviewed=[]
for row in manifest['rows']:
    n=int(row['id'].split('-')[-1]); row=dict(row)
    if n in rejected:row.update(reviewDecision='excluded',reviewReason=rejected[n])
    else:
        row.update(reviewDecision='eligible-for-exploratory-comparison-only',labelEvidence='explicit publisher title plus model-independent AI visual inspection of original-derived contact sheet; NOT human truth',expectedCategory=row['proposedCategory'],expectedType=row['proposedType'],expectedColor=colors.get(n),verified=False,humanVerified=False,blindAcceptance=False,reviewedBeforeModelInference=True)
        if n==25:row['expectedType']='Casual dress'
        if n==28:row['expectedType']='Formal dress'
        if n==27:row['expectedType']='Dress';row['acceptedTypes']=['Casual dress','Formal dress','Shirt dress'];row['subtypeAmbiguous']=True
        if n==21:row['subtypeAmbiguous']=True;row['reviewNote']='Publisher calls historical satin boots ankle boots; high upper silhouette, needs human subtype adjudication.'
        if n in colors:row['colorLabelEvidence']='AI visual contact-sheet label only; uncertain lighting and off-white/gray distinctions require human adjudication'
        reviewed.append(row)
    row['modelExposed']=False
    manifest['rows'][n-1]=row
review={'schema':'closet-current-parallel67-ai-reviewed-exploratory/v1','notHumanGroundTruth':True,'notBlindAcceptance':True,'frozenBeforeModelInference':True,'candidateManifestSha256':hashlib.sha256((out/'manifest.json').read_bytes()).hexdigest(),'reviewMethod':'Model-independent AI visual review of original-derived contact sheets, before any candidate/baseline inference; explicit publisher labels cross-checked. No humans participated.','limitations':['Only 19 eligible photographs, 16 garments plus 3 negatives. No representative population accuracy claim.','Modern T-shirts/sneakers mixed with museum blouses, tunic, boots and dresses; substantial domain bias.','Zero independently human-labeled photographs; zero sealed acceptance photographs.','No polygon annotations or instance labels; no segmentation metric can be derived.','Colors are AI visual proposals only, not independent calibrated human labels.','Three negatives come from one archive/building context; correlated scenes.','Museum/provenance identities checked against earlier benchmark strings and same-object duplicate views removed within this collection; unidentified object overlaps remain possible.'],'rows':reviewed,'excluded':[{'id':r['id'],'reason':r['reviewReason']} for r in manifest['rows'] if r['reviewDecision']=='excluded']}
(out/'reviewed-development.json').write_text(json.dumps(review,indent=2)+'\n')
(out/'reviewed-development.sha256').write_text(hashlib.sha256((out/'reviewed-development.json').read_bytes()).hexdigest()+'  reviewed-development.json\n')
(out/'review-decisions.json').write_text(json.dumps({'noModelInference':True,'rows':[{'id':r['id'],'reviewDecision':r['reviewDecision'],'reason':r.get('reviewReason')} for r in manifest['rows']]},indent=2)+'\n')
print('ELIGIBLE',len(reviewed),'GARMENTS',sum(r['expectedCategory']!='Uncategorized' for r in reviewed))
