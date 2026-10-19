// Measurable file/scene diagnostics remain separate from release approval.
export function checkCreatedPacket(report){
 if(report?.schemaVersion!==1||report.figures?.length!==2||report.figures.map(f=>f.id).sort().join(',')!=='female,male')throw Error('Exactly two fixed candidates required');
 if(report.blenderVersion!=='4.3.0'||report.status!=='two-created-candidates-held-for-review')throw Error('Unsupported render provenance');
 const hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
 for(const f of report.figures){
  if(!f.nativeSceneRender||f.resizedFromPreview!==false||f.renderWidth!==1941||f.renderHeight!==3597||!hex(f.pngSha256)||!hex(f.sceneSha256)||f.legPoseMaxMotion!==0)throw Error('Missing native render evidence or unsafe pose motion');
  if(f.visualApproved!==false||f.commercialProductApproval!==false||f.jointApproval!==false)throw Error('No approval may be inferred from a render');
  for(const [name,size]of [['master',[1941,3597]],['minimum',[1294,2398]],['mobile',[970,1798]]]){
   const v=f.variants?.[name];if(!v||v.width!==size[0]||v.height!==size[1]||v.frames!==1||v.mode!=='RGBA'||!v.iccProfilePresent||!v.borderClear||!hex(v.sha256)||v.transparentPixels<=0||v.opaquePixels<=0||v.softAlphaPixels<=0)throw Error('Invalid candidate '+name);
  }
 }
 if(report.summary.productionApproved!==0||report.summary.independentVisualApprovals!==0||report.summary.physicalPhones!==0||!Array.isArray(report.blockers)||!report.blockers.length)throw Error('Unreviewed quality must remain blocked');
 return {fileAndSceneDiagnosticsPassed:true,productionReady:false,commercialProductApproved:false,photorealismVerified:false,anatomyApproved:false};
}
