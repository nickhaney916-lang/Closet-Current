import {compare} from './demo.mjs';
import {garments} from './fixtures.mjs';
for(const name of Object.keys(garments)){const b=document.createElement('button');b.textContent=name;b.onclick=()=>compare(name);document.getElementById('nav').append(b);}
await compare('shirt');window.ready=true;
