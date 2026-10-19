// Preview-CANDIDATE only. Select smallest native tier that resolves effective
// device pixels. No deployment/automatic figure promotion or customer data.
export const WIDTHS=Object.freeze([
 Object.freeze({name:'phone1x',width:647,suffix:'-phone-647.webp'}),
 Object.freeze({name:'mobile',width:970,suffix:'-mobile.webp'}),
 Object.freeze({name:'tablet2x',width:1294,suffix:'-tablet-1294.webp'}),
 Object.freeze({name:'master',width:1941,suffix:'-master.png'})
]);
export function selectFigureAssetTier(cssWidth,dpr=1,cssZoom=1){
 if(![cssWidth,dpr,cssZoom].every(Number.isFinite)||
  cssWidth<=0||cssWidth>1941||dpr<=0||dpr>4||cssZoom<=0||cssZoom>3)
  throw Error('Unsupported figure display sampling parameters');
 const required=cssWidth*dpr*cssZoom;
 const chosen=WIDTHS.find(t=>t.width>=required)||WIDTHS.at(-1);
 return Object.freeze({...chosen,requiredWidth:required,
  nativeSamplingSufficient:chosen.width>=required,
  visualQualityOrRightsApproved:false});
}
