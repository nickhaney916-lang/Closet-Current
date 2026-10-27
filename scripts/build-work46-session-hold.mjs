import {assertWork44HOLD,OUTPUT as PARENT} from './build-work44-visual-board-hold.mjs';
import {readFile,writeFile,cp,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
export const OUTPUT='dist-work46-session-HOLD';
const UI='__alpha_research/family-alpha-29/ui.mjs';
const before="clearPhotoBoards();cards.replaceChildren();workflow.invalidate();status.textContent='Clothes or account changed. Choose your piece and generate again.';";
const after="clearPhotoBoards();cards.replaceChildren();workflow.invalidate();status.textContent='Could not complete this step. Check your saved clothes and account, then try again.';";
export function patchUI(s){assert.equal(s.split(before).length,2,'Work44 failure anchor changed');return s.replace(before,after);}
export async function build(){await assertWork44HOLD();await rm(OUTPUT,{recursive:true,force:true});await cp(PARENT,OUTPUT,{recursive:true});const p=join(OUTPUT,UI),original=await readFile(p,'utf8');await writeFile(p,patchUI(original));assert.equal(await readFile(p,'utf8'),patchUI(await readFile(join(PARENT,UI),'utf8')));return {releaseGate:'HOLD',deploymentAuthorized:false,parent:'4a182cf817284b061f4c4a885958e3b0472d555d'};}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log('WORK46_HOLD',JSON.stringify(await build()));
