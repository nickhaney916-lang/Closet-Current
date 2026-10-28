import {applyReviewedEraser as legacy,hasTwoClearlySeparatedFootwearComponents} from '../family-alpha-35/reviewed-mask-controls.mjs';import {applyMaskRefinement} from './refine-engine.mjs';
export {hasTwoClearlySeparatedFootwearComponents};
export function applyReviewedEraser(base,edits,options={}){return edits?.some(e=>e?.action)?applyMaskRefinement(base,edits,{...options,legacy}):legacy(base,edits,options);}
