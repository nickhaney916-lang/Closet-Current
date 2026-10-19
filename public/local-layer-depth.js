'use strict';
// Fixed-figure LOCAL contact shading policy. Never alter garment pixels or
// infer human occlusion anatomy. CSS uses the garment PNG's real alpha,
// not its box, and applies only when a successfully rendered underlayer exists.
(function(root){
 const outerwearSlots=Object.freeze(['layer','layer2','layer3']);
 function depthFor(placement,drawnSlots){
  if(!placement||placement.category!=='Outerwear'||
   !outerwearSlots.includes(placement.slot)||
   !(drawnSlots instanceof Set))return Object.freeze({enabled:false,reason:'not-eligible-outerwear'});
  const underlayer=['top','layer','layer2'].some(slot=>
   slot!==placement.slot&&drawnSlots.has(slot));
  return Object.freeze({enabled:underlayer,
   reason:underlayer?'approved-underlayer-present':'no-confirmed-underlayer',
   sourcePixelsChanged:false,anatomicalOcclusionVerified:false,
   physicalShadingVerified:false});
 }
 const api=Object.freeze({depthFor});
 root.ClosetLocalLayerDepth=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
