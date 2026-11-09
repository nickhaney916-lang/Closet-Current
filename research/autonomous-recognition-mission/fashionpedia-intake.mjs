/** Metadata-only intake, never independent benchmark promotion or image permission proof. */
import {createHash} from 'node:crypto';
export const FASHIONPEDIA_VAL_SHA256='f831f415edad12d52acde8b138fe7ebd1592b57bf0dcd6a3b63ba8cabd208223';
export const FASHIONPEDIA_SOURCE='https://s3.amazonaws.com/ifashionist-dataset/annotations/instances_attributes_val2020.json';
export function intakeFashionpedia(bytes){
 if(createHash('sha256').update(bytes).digest('hex')!==FASHIONPEDIA_VAL_SHA256)throw Error('Fashionpedia source digest mismatch; review upstream change');
 const data=JSON.parse(bytes.toString('utf8'));
 const license=data.licenses.find(x=>x.id===0);
 if(license?.url!=='https://creativecommons.org/licenses/by/2.0/')throw Error('Fashionpedia CC BY license mapping changed');
 const candidates=data.images.filter(x=>x.license===0).map(x=>({
  datasetImageId:x.id,fileName:x.file_name,width:x.width,height:x.height,
  recordedOriginalURL:x.original_url,recordedImageLicense:license.url,
  annotationInstanceCount:data.annotations.filter(a=>a.image_id===x.id).length,
  sourceJPEGVerified:false,originalRightsVerified:false,creatorAttributionVerified:false,
  modelExposureAudited:false,independentHoldoutEligible:false,quarantined:true
 })).sort((a,b)=>a.datasetImageId-b.datasetImageId);
 if(candidates.length!==153||new Set(candidates.map(x=>x.datasetImageId)).size!==153)throw Error('Fashionpedia candidate cohort changed');
 return {schema:'closet-current-fashionpedia-candidate-intake/v1',
  source:FASHIONPEDIA_SOURCE,sourceSHA256:FASHIONPEDIA_VAL_SHA256,
  attribution:'Fashionpedia Consortium; Jia et al., Fashionpedia: Ontology, Segmentation, and an Attribute Localization Dataset, ECCV 2020',
  annotationLicense:'https://creativecommons.org/licenses/by/4.0/',
  licensePolicy:'Only records declaring CC BY 2.0 enter this candidate queue; source rights and creator attribution still require verification. Annotation licensing does not grant image rights.',
  totalSourceImages:data.images.length,totalSourceAnnotations:data.annotations.length,
  candidateCount:candidates.length,excludedImageCount:data.images.length-candidates.length,
  sourceHumanAnnotationStatus:'Published human-annotated dataset; not independently re-adjudicated by Closet Current',
  exactClosetSubtypeMapped:false,primaryColorGroundTruthAvailable:false,
  acceptedBenchmarkPhotos:0,recognitionAccuracy:null,segmentationIoU:null,
  releaseAuthorized:false,familyAlpha:'HOLD',candidates};
}
