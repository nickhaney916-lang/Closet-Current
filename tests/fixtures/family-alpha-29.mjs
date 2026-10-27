import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {createNewClothesWorkflow} from '../../research/family-alpha-29/workflow.mjs';
export const A='a1111111-1111-4111-8111-111111111111',B='b2222222-2222-4222-8222-222222222222';
export function fixtures(owner=A){let n=0;return [['pin','Tops','T-shirt'],['top2','Tops','Polo'],['top3','Tops','T-shirt'],['bottom1','Bottoms','Jeans'],['bottom2','Bottoms','Shorts'],['bottom3','Bottoms','Trousers'],['shoe1','Shoes','Sneakers'],['shoe2','Shoes','Sneakers'],['shoe3','Shoes','Sneakers'],['shoe4','Shoes','Sneakers']].map(([id,category,itemType])=>{const b=Buffer.alloc(180,++n);b[0]=255;b[1]=216;b[178]=255;b[179]=217;const image='data:image/jpeg;base64,'+b.toString('base64');return {id,name:id,ownerId:owner,category,itemType,color:'Blue',pattern:'Solid',seasons:[],image,originalPhoto:{image},userAdjusted:true};});}
export function harness(){
 const style={URL,Date,encodeURIComponent};vm.createContext(style);for(const f of ['outfit-matcher.js','trend-library.js','outfit-board-engine.js','closet-stylist-engine.js'])vm.runInContext(readFileSync('public/'+f,'utf8'),style);
 const h={ctx:{authenticatedUserId:A,currentUserId:A,cloudOwnerId:A,indexedDbName:'closet-current-user-'+A,sessionGeneration:1},clothes:fixtures(),favorites:[],writes:0,board:{id:'outfit-board',current:{slots:{},ideas:{}},saved:[{name:'Existing favorite',slots:{}}]}};
 const store={async readFavorites(){return structuredClone(h.favorites);},async readBoard(){return structuredClone(h.board);},async saveFavorite(v,o){o.guard();h.writes++;h.favorites.push(structuredClone(v));},async restoreBoard(v,o){o.guard();h.writes++;h.board={...h.board,current:structuredClone(v)};return structuredClone(h.board);}};
 h.verify=async()=>({ownerId:h.ctx.authenticatedUserId,sessionGeneration:h.ctx.sessionGeneration});
 h.deps={readContext:()=>h.ctx,readWardrobe:()=>h.clothes,verifySession:()=>h.verify(),store,cryptoProvider:webcrypto,stylistItemScore:(...x)=>style.stylistItemScore(...x),stylistHarmony:(...x)=>style.stylistHarmony(...x),cleanOutfitBoard:(...x)=>style.cleanOutfitBoard(...x),renderPreview:async({guard})=>{guard();return {simulated:true};}};
 h.client=createNewClothesWorkflow(h.deps);return h;
}
