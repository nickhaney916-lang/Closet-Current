"""Actual COCO-mask IoU, one-to-one matching; no detector oracle prompts."""
import gzip,hashlib,json,math
from pathlib import Path
import numpy as np
from pycocotools import mask as coco_mask

ROOT=Path(__file__).resolve().parents[1]
DIRECTORY=ROOT/'research/parallel67-reference'

def category(category_id):
    if category_id in (0,1,2):return 'Tops'
    if category_id in (3,4,5,9,12):return 'Outerwear'
    if category_id in (6,7,8,21):return 'Bottoms'
    if category_id in (10,11):return 'Dresses'
    if category_id==23:return 'Shoes'
    return 'Accessories'

def one_to_one(iou,compatible=None,threshold=.5):
    """Maximum-cardinality bipartite matching, never reuse a predicted mask."""
    matrix=np.asarray(iou,dtype=float)
    if matrix.ndim!=2 or not np.isfinite(matrix).all() or np.any(matrix<0) or np.any(matrix>1):raise ValueError('Invalid measured IoU')
    g,p=matrix.shape
    allowed=np.ones((g,p),dtype=bool) if compatible is None else np.asarray(compatible,dtype=bool)
    if allowed.shape!=matrix.shape:raise ValueError('Category compatibility shape')
    edges=[sorted([j for j in range(p) if allowed[i,j] and matrix[i,j]>=threshold],key=lambda j:(-matrix[i,j],j)) for i in range(g)]
    assigned={}
    def assign(i,seen):
        for j in edges[i]:
            if j in seen:continue
            seen.add(j)
            if j not in assigned or assign(assigned[j],seen):assigned[j]=i;return True
        return False
    for i in range(g):assign(i,set())
    return sorted([{'truthIndex':i,'predictionIndex':j,'iou':float(matrix[i,j])} for j,i in assigned.items()],key=lambda x:x['truthIndex'])

def evaluate(manifest,model):
    sources={x['id']:x for x in manifest['rows']}
    observed=model['rows']
    if len(observed)!=8 or len({x['id'] for x in observed})!=8 or set(sources)!={x['id'] for x in observed}:raise ValueError('Incomplete human reference cohort')
    rows=[]
    for result in observed:
        source=sources[result['id']]
        if source['sha256']!=result['sha256'] or (source['height'],source['width'])!=(result['height'],result['width']):raise ValueError('Source identity mismatch')
        h,w=source['height'],source['width']
        truth=source['annotations']
        gt=[coco_mask.merge(coco_mask.frPyObjects(x['segmentation'],h,w)) for x in truth]
        predictions=result['regions'];pr=[]
        for item in predictions:
            data=gzip.decompress((ROOT/item['maskFile']).read_bytes())
            if len(data)!=h*w or hashlib.sha256(data).hexdigest()!=item['maskSha256']:raise ValueError('Actual predicted mask changed')
            a=np.frombuffer(data,dtype=np.uint8).reshape(h,w)
            if not np.isin(a,[0,1]).all():raise ValueError('Prediction is not binary mask')
            pr.append(coco_mask.encode(np.asfortranarray(a)))
        iou=np.asarray(coco_mask.iou(pr,gt,[0]*len(gt))).T if pr else np.zeros((len(gt),0))
        compatible=np.array([[category(t['category_id']) in p.get('categories',[p.get('category')]) for p in predictions] for t in truth],dtype=bool).reshape(len(gt),len(pr))
        agnostic=one_to_one(iou);aware=one_to_one(iou,compatible)
        rows.append({'id':source['id'],'sha256':source['sha256'],'groundTruthInstances':len(gt),'predictedInstances':len(pr),'classAgnosticMatches':agnostic,'categoryCompatibleMatches':aware,
          'truth':[{'annotationId':t['id'],'categoryId':t['category_id'],'category':category(t['category_id'])} for t in truth],
          'predictions':[{'label':p['label'],'categories':p.get('categories',[p.get('category')])} for p in predictions],
          'measuredIoU':iou.tolist(),'elapsedMs':result['elapsedMs']})
    def summary(key):
        tp=sum(len(r[key]) for r in rows);ng=sum(r['groundTruthInstances'] for r in rows);npred=sum(r['predictedInstances'] for r in rows)
        return {'matched':tp,'groundTruth':ng,'predicted':npred,'falseNegatives':ng-tp,'falsePositives':npred-tp,'recall':tp/ng if ng else None,'precision':tp/npred if npred else 0}
    per_category={}
    for name in sorted({category(t['category_id']) for s in sources.values() for t in s['annotations']}):
        truth_count=sum(sum(t['category']==name for t in r['truth']) for r in rows)
        matched=sum(sum(r['truth'][m['truthIndex']]['category']==name for m in r['categoryCompatibleMatches']) for r in rows)
        per_category[name]={'matched':matched,'total':truth_count,'recall':matched/truth_count}
    elapsed=sorted(r['elapsedMs'] for r in rows)
    return {'classAgnostic':summary('classAgnosticMatches'),'categoryCompatible':summary('categoryCompatibleMatches'),'perCategory':per_category,
      'latencyMs':{'median':float(np.median(elapsed)),'p95':elapsed[math.ceil(.95*len(elapsed))-1]},'rows':rows}

if __name__=='__main__':
    manifest_bytes=(DIRECTORY/'fashionpedia/manifest.json').read_bytes()
    manifest=json.loads(manifest_bytes)
    frozen=(DIRECTORY/'fashionpedia/manifest.sha256').read_text().split()[0]
    if hashlib.sha256(manifest_bytes).hexdigest()!=frozen:raise ValueError('Frozen human reference changed')
    baseline=json.loads((DIRECTORY/'results/segformer-fashionpedia.json').read_text())
    candidate=json.loads((DIRECTORY/'results/reference-fashionpedia.json').read_text())
    report={'format':'closet-current-parallel67-human-mask-comparison/v1','manifestSha256':frozen,'independentHumanAnnotations':True,'notSealedNovelAcceptance':True,'pretrainingOverlap':'unknown',
       'threshold':.5,'matching':'maximum-cardinality one-to-one original-resolution COCO-mask IoU',
       'baseline':evaluate(manifest,baseline),'reference':evaluate(manifest,candidate),'publishedODPattern':evaluate(manifest,{**candidate,'rows':[{**r,'regions':[p for p in r['regions'] if any(e['stage']=='object_detection' for e in p.get('evidence',[]))]} for r in candidate['rows']]}),'fineSubtypeAccuracy':'not_available','colorAccuracy':'not_available','automaticSave':False}
    (DIRECTORY/'results/human-mask-comparison.json').write_text(json.dumps(report,indent=2)+'\n')
    for name in ['baseline','reference','publishedODPattern']:print(name,json.dumps({k:v for k,v in report[name].items() if k!='rows'}))
