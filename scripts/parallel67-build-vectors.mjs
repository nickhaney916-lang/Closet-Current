// Build genuinely independent learned vectors for the unchanged app vocabulary.
import {AutoTokenizer,SiglipTextModel,CLIPTextModelWithProjection} from '@huggingface/transformers';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const key=process.argv[2]||'marqo';
const specs={marqo:['Marqo/marqo-fashionSigLIP','c56244cc94f92419e8369fa71efdaf403b124ce8',SiglipTextModel,64],marqoclip:['Marqo/marqo-fashionCLIP','44f4c655124ed71e90cbf528d82f508d69d8a81b',CLIPTextModelWithProjection,77]};
if(!specs[key])throw Error('Unknown pinned model');
const [model,revision,Model,length]=specs[key];
const labels=JSON.parse(await readFile('public/recognition-vectors.json')).labels;
const tokenizer=await AutoTokenizer.from_pretrained(model,{revision});
const encoder=await Model.from_pretrained(model,{revision,dtype:'q8',device:'cpu'});
const vectors=[];
for(let i=0;i<labels.length;i+=16){
 const output=await encoder(tokenizer(labels.slice(i,i+16).map(label=>'A photo of '+label+'.'),{padding:'max_length',max_length:length,truncation:true}));
 for(const row of output.text_embeds.tolist()){
  const norm=Math.hypot(...row);if(!Number.isFinite(norm)||norm<1e-8)throw Error('Invalid text embedding');vectors.push(...row.map(x=>x/norm));
 }
 if(i%160===0)console.log(key,i,labels.length);
}
const buffer=Buffer.from(new Float32Array(vectors).buffer);
const directory='research/parallel67/assets';await mkdir(directory,{recursive:true});
await writeFile(directory+'/'+key+'.bin',buffer);
await writeFile(directory+'/'+key+'.json',JSON.stringify({version:67,model,revision,dimensions:vectors.length/labels.length,scale:100,labels,textDtype:'q8',promptTemplate:'A photo of {}.',sha256:createHash('sha256').update(buffer).digest('hex')},null,2)+'\n');
await encoder.dispose();
