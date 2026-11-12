"""Source-complete externally human-labeled instance and boundary evaluation."""
import argparse,gzip,hashlib,importlib.util,json,math
from pathlib import Path
import numpy as np
from pycocotools import mask as coco
from scipy.ndimage import binary_erosion,binary_dilation
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('reference',ROOT/'scripts/parallel67-reference-evaluate.py')
reference=importlib.util.module_from_spec(spec);spec.loader.exec_module(reference)

def boundary_f(gt,pred,tolerance):
    a=gt&~binary_erosion(gt);b=pred&~binary_erosion(pred)
    if not a.any() or not b.any():return 0.
    precision=float((b&binary_dilation(a,iterations=tolerance)).sum()/b.sum())
    recall=float((a&binary_dilation(b,iterations=tolerance)).sum()/a.sum())
    return 2*precision*recall/(precision+recall) if precision+recall else 0.

def evaluate68(manifest,report):
    sources={x['id']:x for x in manifest['rows']};seen=set();rows=[]
    if len(report['rows'])!=len(sources):raise ValueError('Missing original photographic results')
    for row in report['rows']:
        if row['id'] not in sources or row['id'] in seen:raise ValueError('Duplicate/unknown original')
        seen.add(row['id']);truth=sources[row['id']];h,w=truth['height'],truth['width']
        if truth['sha256']!=row['sha256'] or row['width']!=w or row['height']!=h:raise ValueError('Original source identity changed')
        annotations=[a for a in truth['annotations'] if a['category_id']<=26]
        gt_rles=[]
        for a in annotations:
            s=a['segmentation'];gt_rles.append(coco.merge(coco.frPyObjects(s,h,w)) if isinstance(s,list) else coco.frPyObjects(s,h,w))
        regions=row['regions'];pred_rles=[];pred_bits=[]
        for region in regions:
            bits=gzip.decompress((ROOT/region['maskFile']).read_bytes())
            if len(bits)!=h*w or hashlib.sha256(bits).hexdigest()!=region['maskSha256']:raise ValueError('Predicted mask integrity failure')
            array=np.frombuffer(bits,dtype=np.uint8).reshape(h,w)
            if not np.isin(array,[0,1]).all():raise ValueError('Not an actual binary mask')
            pred_bits.append(array.astype(bool));pred_rles.append(coco.encode(np.asfortranarray(array)))
        iou=np.asarray(coco.iou(pred_rles,gt_rles,[0]*len(gt_rles))).T if pred_rles else np.zeros((len(gt_rles),0))
        matches=reference.one_to_one(iou)
        compatibility=np.array([[reference.category(a['category_id']) in r.get('categories',[r.get('category')]) for r in regions] for a in annotations],bool).reshape(len(annotations),len(regions))
        compatible=reference.one_to_one(iou,compatibility)
        tolerance=max(1,round(max(h,w)*.003));boundary=[]
        for match in matches:
            gt=coco.decode(gt_rles[match['truthIndex']]).astype(bool);pred=pred_bits[match['predictionIndex']]
            boundary.append({'truthIndex':match['truthIndex'],'predictionIndex':match['predictionIndex'],'fScore':boundary_f(gt,pred,tolerance)})
        rows.append({'id':row['id'],'sha256':row['sha256'],'truthCount':len(annotations),'predictedCount':len(regions),'matches':matches,'categoryCompatibleMatches':compatible,'measuredMaskIoU':iou.tolist(),'boundaryTolerancePixels':tolerance,'boundaryMatches':boundary,'truth':[{'annotationId':a['id'],'categoryId':a['category_id'],'category':reference.category(a['category_id'])} for a in annotations],'elapsedMs':row['elapsedMs']})
    ntruth=sum(r['truthCount'] for r in rows);npred=sum(r['predictedCount'] for r in rows);tp=sum(len(r['matches']) for r in rows)
    elapsed=sorted(r['elapsedMs'] for r in rows)
    per_category={}
    for name in sorted({a['category'] for row in rows for a in row['truth']}):
        total=sum(sum(a['category']==name for a in row['truth']) for row in rows)
        matched=sum(sum(row['truth'][m['truthIndex']]['category']==name for m in row['matches']) for row in rows)
        per_category[name]={'matched':matched,'total':total,'instanceRecall':matched/total}
    return {'schema':'closet-current-parallel68-human-mask-evaluation/v1','split':report.get('split'),'photos':len(rows),'truthInstances':ntruth,'predictedInstances':npred,'matched':tp,'falseNegatives':ntruth-tp,'falsePositives':npred-tp,'instanceRecall':tp/ntruth,'instancePrecision':tp/npred if npred else 0,'categoryCompatibleMatched':sum(len(r['categoryCompatibleMatches']) for r in rows),'perCategory':per_category,'boundaryFAllTruth':sum(m['fScore'] for r in rows for m in r['boundaryMatches'])/ntruth,'latencyMs':{'median':float(np.median(elapsed)),'p95':elapsed[math.ceil(len(elapsed)*.95)-1]},'broadCategoryAccuracy':'NOT_ESTABLISHED_BY_INSTANCE_COMPATIBILITY','fineSubtypeAccuracy':'NO_HUMAN_SUBTYPE_LABELS','primaryColorAccuracy':'NO_HUMAN_COLOR_LABELS_IN_THIS_MASK_CORPUS','automaticAcceptance':{'coverage':0,'errorRate':None,'status':'NOT_CALIBRATED_NO_AUTOMATIC_ADMISSION'},'independentHumanMasks':True,'pretrainingExposure':'unknown_public_dataset','notSealedNovelAcceptance':True,'rows':rows}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('manifest');parser.add_argument('results');parser.add_argument('output');args=parser.parse_args()
    manifest_bytes=(ROOT/args.manifest).read_bytes();report=json.loads((ROOT/args.results).read_text())
    if report['manifestSha256']!=hashlib.sha256(manifest_bytes).hexdigest():raise ValueError('Frozen source manifest SHA differs')
    result=evaluate68(json.loads(manifest_bytes),report);(ROOT/args.output).write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='rows'}))
