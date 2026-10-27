import {createAlphaHumanoidFigure,renderPhotoLayers} from '../../public/family-alpha-2d-photo-renderer.mjs';
import {paintGarmentFit} from './fit.mjs';
/** Diagnostic renderer only, NOT an authentication or approval boundary. */
export function renderLandmarkPrototype(host,image,profile,adjust={}){
 const frame=document.createElement('div');frame.className='family-alpha-avatar';frame.style.cssText='position:relative;width:min(100%,360px);aspect-ratio:3/5;margin:auto;overflow:hidden;background:#f3f4f6';frame.append(createAlphaHumanoidFigure(document));
 const canvas=document.createElement('canvas');const plan=paintGarmentFit(canvas,image,profile,adjust);canvas.dataset.slot=profile.slot;canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%';frame.append(canvas);host.replaceChildren(frame);return plan;
}
export function renderBaseline(host,image,row){renderPhotoLayers(host,[{slot:row.profile?.slot||({Tops:'top',Bottoms:'bottom',Outerwear:'layer',Dresses:'dress',Shoes:'shoes'}[row.category]),itemId:row.id,sourceIdentity:row.id,sourceVersion:row.sourceSHA256}],{[row.id]:image});}
