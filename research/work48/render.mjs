import {createAlphaHumanoidFigure} from '../../public/family-alpha-2d-photo-renderer.mjs';
import {createHumanoidForegroundOverlay} from '../work47/occlusion.mjs';
import {paintGarmentFit as beforePaint} from './before-fit.mjs';
import {paintGarmentFit} from '../work47/fit.mjs';
import {protectCollarPixels} from './collar-occlusion.mjs';
export function renderFit(host,image,profile,adjust={},before=false){
 const frame=document.createElement('div');frame.className='family-alpha-avatar';frame.style.cssText='position:relative;width:min(100%,360px);aspect-ratio:3/5;margin:auto;overflow:hidden;background:#f3f4f6';frame.append(createAlphaHumanoidFigure(document));
 const canvas=document.createElement('canvas'),result=(before?beforePaint:paintGarmentFit)(canvas,image,profile,adjust);canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%';frame.append(canvas);const fg=createHumanoidForegroundOverlay(document);if(!before)protectCollarPixels(fg,[canvas]);frame.append(fg);host.replaceChildren(frame);return result;
}
