/**
 * NATIVE-MOBILE-COMFORT-09 — opt-in tactile/reflow polish for the real
 * original-owner Outfit Builder / source readiness / anatomical WebGL dialog.
 * Pure CSS; no garment state, data, auth, cloud, geometry or camera mutation.
 * Family Alpha HOLD. No release and no production deployment.
 */
export const NATIVE_MOBILE_09=Object.freeze({
 gate:'nativeLossless04=research&native3D05=research&sourceReadiness08=research&nativeMobile09=research',
 minimumTouchTargetPx:48,viewports:Object.freeze([320,390,430]),
 photosModified:false,ownerRecordsModified:false,geometryModified:false,
 productionAuthorized:false,familyAlpha:'HOLD'
});
export const NATIVE_MOBILE_09_CSS=String.raw`
/* Every selector is scoped to the existing opt-in research controls. */
@media (max-width: 640px) {
 #nativeLossless04Controls {
  display:grid !important;grid-template-columns:repeat(2,minmax(0,1fr));
  gap:8px;align-items:stretch;width:100%;max-width:100%;min-width:0;
 }
 #nativeLossless04Controls button {
  width:100%;min-width:0;min-height:52px;padding:10px 7px;
  white-space:normal;overflow-wrap:anywhere;line-height:1.2;text-align:center;
 }
 #nativeLossless04Controls #native04DeleteOutfit {grid-column:1/-1}
 #native3D05Preview,#nativeReadiness08Check {
  display:block;width:100%;max-width:100%;min-width:0;
  min-height:52px;padding:10px 8px;line-height:1.3;
  white-space:normal;overflow-wrap:anywhere;
 }
 #nativeReadiness08 {
  max-width:100%;min-width:0;overflow-wrap:anywhere;
  padding:10px;margin:10px 0;
 }
 #nativeReadiness08Results {
  grid-template-columns:minmax(0,1fr);gap:8px;
  width:100%;min-width:0;max-width:100%;
 }
 #nativeReadiness08Results .native-readiness08-item {
  width:100%;min-width:0;max-width:100%;align-items:flex-start;
  overflow-wrap:anywhere;
 }
 #nativeReadiness08Results .native-readiness08-item img {
  width:68px;height:85px;max-width:32%;object-fit:contain;
 }
 #outfit3D01Dialog {
  width:100vw;max-width:100vw;min-width:0;
  max-height:100dvh;margin:auto;border-radius:0;
  padding:0;overflow:hidden;
 }
 #outfit3D01Dialog .cc3d-header {
  position:sticky;top:0;z-index:4;
  padding:calc(8px + env(safe-area-inset-top,0px)) 10px 9px;
  min-height:60px;gap:8px;
 }
 #outfit3D01Dialog .cc3d-header h2 {
  font-size:16px;line-height:1.3;min-width:0;
  overflow-wrap:anywhere;
 }
 #outfit3D01Dialog #outfit3D01Close {
  flex:0 0 auto;min-width:64px;min-height:48px;padding:8px;
 }
 #outfit3D01Dialog .cc3d-body {
  width:100%;max-width:100%;min-width:0;
  max-height:calc(100dvh - 60px - env(safe-area-inset-top,0px));
  overflow-y:auto;overscroll-behavior:contain;
  padding:7px 8px max(20px,env(safe-area-inset-bottom,0px));
  gap:6px;
 }
 #outfit3D01Dialog .cc3d-viewer,
 #outfit3D01Dialog .cc3d-body>section {
  max-width:100%;min-width:0;
 }
 #outfit3D01Dialog .cc3d-viewer canvas {
  display:block;max-width:100%;width:100%;
  height:clamp(235px,42dvh,420px);min-height:235px;
  touch-action:none;
 }
 #outfit3D01Dialog .cc3d-controls {
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));
  gap:6px;padding:7px 6px;
 }
 #outfit3D01Dialog .cc3d-controls button {
  width:100%;min-width:0;min-height:48px;
  padding:8px 2px;font-size:clamp(13px,3.9vw,16px);
  line-height:1.2;touch-action:manipulation;
 }
 #outfit3D01Dialog .cc3d-field select,
 #outfit3D01Dialog .cc3d-field input {
  min-height:48px;max-width:100%;
 }
 #outfit3D01Dialog .cc3d-evidence {
  grid-template-columns:repeat(2,minmax(0,1fr));max-width:100%;
 }
 #outfit3D01Dialog .cc3d-photo {
  min-width:0;max-width:100%;overflow-wrap:anywhere;
 }
 #outfit3D01Dialog button:focus-visible,
 #outfit3D01Dialog select:focus-visible,
 #nativeLossless04Controls button:focus-visible,
 #native3D05Preview:focus-visible,
 #nativeReadiness08Check:focus-visible {
  outline:3px solid #6734b1;outline-offset:2px;
 }
}
@media (max-width: 360px) {
 #outfit3D01Dialog .cc3d-header h2 {font-size:15px}
 #outfit3D01Dialog .cc3d-viewer canvas {
  height:37dvh;min-height:225px;
 }
 #outfit3D01Dialog .cc3d-fields {gap:6px}
 #outfit3D01Dialog .cc3d-photo img {height:85px}
}
@media (prefers-reduced-motion: reduce) {
 #outfit3D01Dialog button,
 #nativeLossless04Controls button,
 #native3D05Preview,
 #nativeReadiness08Check {
  transition:none !important;scroll-behavior:auto !important;
 }
}
`;
export function mountNativeMobile09({
 win=globalThis.window,doc=win?.document,board=win?.nativeLossless04Bridge
}={}){
 if(!win||!doc||!board?.status?.().active||
   typeof win.closetAuth?.getAccessToken!=='function'||
   !win.closetAuth?.user?.id||
   !doc.getElementById('nativeLossless04Controls')||
   !doc.getElementById('native3D05Preview')||
   !doc.getElementById('nativeReadiness08')||
   !doc.getElementById('appShell')||!doc.getElementById('authGate')||
   doc.getElementById('nativeMobile09Styles'))
  throw Error('MOBILE09 native signed-in source-honest research controls required');
 const query=new URLSearchParams(win.location?.search||'');
 if(query.get('nativeMobile09')!=='research'||
    query.get('nativeLossless04')!=='research'||
    query.get('native3D05')!=='research'||
    query.get('sourceReadiness08')!=='research')
  throw Error('MOBILE09 explicit research-only gates required');
 const originalAuth=win.closetAuth;
 const owner=originalAuth.user.id;
 if(doc.getElementById('authGate').hidden!==true||
   doc.getElementById('appShell').hidden!==false)
  throw Error('MOBILE09 signed-in native page required');
 const style=doc.createElement('style');style.id='nativeMobile09Styles';
 style.textContent=NATIVE_MOBILE_09_CSS;
 doc.head.append(style);
 let disposed=false;
 const dispose=()=>{
  if(disposed)return;disposed=true;style.remove();
  win.removeEventListener('pagehide',dispose);
  win.removeEventListener('closet:alpha-session-changed',dispose);
  doc.getElementById('logout')?.removeEventListener('click',dispose,true);
 };
 win.addEventListener('pagehide',dispose);
 win.addEventListener('closet:alpha-session-changed',dispose);
 doc.getElementById('logout')?.addEventListener('click',dispose,true);
 return Object.freeze({
  dispose,state:()=>Object.freeze({active:!disposed&&win.closetAuth===originalAuth&&
   win.closetAuth.user?.id===owner&&board.status().active,
   minimumTouchTargetPx:48,readOnly:true,
   productionAuthorized:false,familyAlpha:'HOLD'}),
  researchOnly:true,releaseAuthorized:false
 });
}
