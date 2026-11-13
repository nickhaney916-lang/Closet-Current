/** Research-only detached P541 / independently checked P175 dress installer.
 * Applies the P2-C36 phase-responsive physical skirt AFTER the exact P61
 * original dress fit, never writes source repo, main, public or production.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
const specified=process.argv[2];
if(!specified)throw Error('P2-C36 detached research donor path required');
const donor=resolve(specified),cwd=resolve('.');
if(donor===cwd||donor==='/'||cwd.startsWith(donor+'/')||
   donor.startsWith(cwd+'/public')||donor.startsWith(cwd+'/supabase'))
 throw Error('P2-C36 refuses current checkout, public, hosted or production');
const donorModule=join(donor,'research/mission2-source-length/source-dress-motion.mjs');
await mkdir(dirname(donorModule),{recursive:true});
await copyFile('research/mission2-source-length/source-dress-motion.mjs',donorModule);
const patch=async(file,from,to)=>{
 const path=join(donor,file),text=await readFile(path,'utf8');
 assert.equal(text.split(from).length,2,'P2-C36 pinned genuine P175 donor changed: '+file);
 await writeFile(path,text.replace(from,to));
};
await patch('research/dress-mobile-01/dress-outfit-controller.mjs',
 "import {refinePhotographedDress61} from '../photo-dress-anatomical-drape-61/dress-drape.mjs';",
 "import {refinePhotographedDress61} from '../photo-dress-anatomical-drape-61/dress-drape.mjs';\n"+
 "import {sampleSourceDressMotion36} from '../mission2-source-length/source-dress-motion.mjs';");
const oldText=
 "      if(new URLSearchParams(globalThis.location?.search||'').get('photoDress175')==='research')\n"+
 "       fitted=refinePhotographedDress61(fitted,root);";
const replacement=
 "      if(new URLSearchParams(globalThis.location?.search||'').get('photoDress175')==='research'){\n"+
 "       fitted=refinePhotographedDress61(fitted,root);\n"+
 "       const params36=new URLSearchParams(globalThis.location?.search||'');\n"+
 "       if(params36.get('photoDressMotion36')==='research'){\n"+
 "        const phase36=Number(params36.get('photoDressMotionPhase36'));\n"+
 "        fitted=sampleSourceDressMotion36(fitted,root,{phase:phase36});\n"+
 "       }\n"+
 "      }";
await patch('research/dress-mobile-01/dress-outfit-controller.mjs',oldText,replacement);
const stats=
 "        photographedDressDrape61:actualOutfit171[k].photographedDressDrape61===true,";
await patch('research/outfit-3d-01/research-panel.mjs',stats,
 stats+"\n"+
 "        sourceDressMotion36:actualOutfit171[k].sourceDressMotion36===true,\n"+
 "        sourceDressMotionPhase36:actualOutfit171[k].sourceDressMotionPhase36,\n"+
 "        sourceDressMotionMovedVertices36:actualOutfit171[k].sourceDressMotionMovedVertices36,\n"+
 "        sourceDressMotionFrontProtected36:actualOutfit171[k].sourceDressMotionFrontProtected36,\n"+
 "        sourceDressMotionMaxMeters36:actualOutfit171[k].sourceDressMotionMaxMeters36,\n"+
 "        sourceDressMotionRestAndUVUnchanged36:actualOutfit171[k].sourceDressMotionRestAndUVUnchanged36===true,\n"+
 "        sourceDressMotionSkinAndJPEGUnchanged36:actualOutfit171[k].sourceDressMotionSkinAndJPEGUnchanged36===true,\n"+
 "        sourceDressMotionNoAccumulation36:actualOutfit171[k].sourceDressMotionNoAccumulation36===true,\n"+
 "        sourceDressMotionSweptCollisionCertified:actualOutfit171[k].sourceDressMotionSweptCollisionCertified===true,\n"+
 "        sourceDressMotionRealClothPhysics:actualOutfit171[k].sourceDressMotionRealClothPhysics===true,");
console.log('M2_C36_SOURCE_DRESS_EXACT_P61_P175_DISPOSABLE_DONOR_INSTALLED_HOLD');
