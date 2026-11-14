/** P2-C52 ONLY: install a read-only original photographed dress 163-bone
 * diagnostic into a DISPOSABLE exact P541+P175+C36 research browser donor.
 * Main app, public/, owner JPEG/wardrobes, production and staged source are
 * never edited. The browser probe exposes only non-identifying numbers.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
const donorArg=process.argv[2];
if(!donorArg)throw Error('C52 disposable donor required');
const donor=resolve(donorArg),cwd=resolve('.');
if(donor==='/'||donor===cwd||cwd.startsWith(donor+'/')||
   donor.startsWith(cwd+'/public')||donor.startsWith(cwd+'/supabase'))
 throw Error('C52 refuses production, current or private wardrobe tree');
await mkdir(join(donor,'research/mission2-p86'),{recursive:true});
await copyFile('research/mission2-p86/surface-metric.mjs',join(donor,'research/mission2-p86/surface-metric.mjs'));
const src='research/mission2-source-length/actual-photo-contact-52.mjs';
const dest=join(donor,src);
await mkdir(dirname(dest),{recursive:true});
await copyFile(src,dest);
await copyFile('research/mission2-source-length/upper-torso-clearance-trial60.mjs',
 join(donor,'research/mission2-source-length/upper-torso-clearance-trial60.mjs'));
await copyFile('research/mission2-source-length/upper-torso-surface-quality61.mjs',
 join(donor,'research/mission2-source-length/upper-torso-surface-quality61.mjs'));
await copyFile('research/mission2-source-length/upper-torso-fit-pareto62.mjs',
 join(donor,'research/mission2-source-length/upper-torso-fit-pareto62.mjs'));
const controllerPath=join(donor,'research/dress-mobile-01/dress-outfit-controller.mjs');
let controller=await readFile(controllerPath,'utf8');
const importAnchor="import {sampleSourceDressMotion36} from '../mission2-source-length/source-dress-motion.mjs';";
assert.equal(controller.split(importAnchor).length,2,
 'C52 requires exact actual original photographed P175+C36 donor');
controller=controller.replace(importAnchor,
 importAnchor+"\nimport {auditActualPhotographedDressSurfaces52} from '../mission2-source-length/actual-photo-contact-52.mjs';");
const anchor="       fitted=refinePhotographedDress61(fitted,root);";
assert.equal(controller.split(anchor).length,2,
 'C52 original P61 garment fit stage missing or changed');
controller=controller.replace(anchor,anchor+
 "\n       // C52: never write any SOURCE fabric. Only this exact SHA-pinned "+
 "Commons 0053 experimental browser query may run the contact probe.\n"+
 "       if(new URLSearchParams(globalThis.location?.search||'').get('photoDressContact52')==='research'){\n"+
 "        const query52=new URLSearchParams(globalThis.location?.search||\x27\x27);\n"+
 "        let evidence52;\n"+
 "        try{evidence52=auditActualPhotographedDressSurfaces52({root,dress:fitted,\n"+
 "         refineTriangleDistances53:query52.get(\x27photoDressDistance53\x27)===\x27research\x27,\n"+
 "         refineSourceTopology54:query52.get(\x27photoDressTopology54\x27)===\x27research\x27,\n"+
 "         refineEdgeWinding55:query52.get(\x27photoDressEdges55\x27)===\x27research\x27,\n"+
 "         refineBoundaryComponents56:query52.get(\x27photoDressBoundaries56\x27)===\x27research\x27,\n"+
 "         refineAnatomicalLoopLandmarks57:query52.get(\x27photoDressLandmarks57\x27)===\x27research\x27,\n"+
 "         refineArticulatedContacts58:query52.get(\x27photoDressContact58\x27)===\x27research\x27,\n"+
 "         refineBodyHeightWitnessBands59:query52.get(\x27photoDressBodyBands59\x27)===\x27research\x27,\n"+
 "         refineUpperTorsoFitTrial60:query52.get(\x27photoDressTorsoTrial60\x27)===\x27research\x27,\n"+
 "         refineSurfaceStrain61:query52.get(\x27photoDressStrain61\x27)===\x27research\x27,\n"+
 "         refineCandidateSweep62:query52.get(\x27photoDressPareto62\x27)===\x27research\x27});\n"+
 "        }catch(e){\n"+
 "         if(query52.get(\x27photoDressTorsoTrial60\x27)===\x27research\x27)\n"+
 "          console.error(\x27M2_C60_SIGNED_SOURCE_TRIAL_REFUSED:\x27+String(e?.message||e).slice(0,220));\n"+
 "         throw e;\n"+
 "        }\n"+
 "        if(evidence52.schema!=='M2-real-original-photo-surface-diagnostic-C52'||\n"+
 "           evidence52.authenticOriginalLicensedDress!==true||\n"+
 "           evidence52.releaseAuthorized!==false)throw Error('C52 source photo evidence refused');\n"+
 "        globalThis.__M2C52LicensedResearchReceipt=evidence52;\n"+
 "       }");
await writeFile(controllerPath,controller);
console.log('M2_C52_DISPOSABLE_ACTUAL_LICENSED_163_BONE_DRESS_AUDIT_INSTALLED_HOLD');
