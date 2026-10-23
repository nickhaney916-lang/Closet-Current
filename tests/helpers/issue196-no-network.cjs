'use strict';
// Preload ONLY the focused offline suite. Reject even localhost, DNS and UDP.
const {syncBuiltinESMExports}=require('node:module');
let attempts=0;
const deny=()=>{attempts++;throw Error('ISSUE196_NETWORK_FORBIDDEN');};
globalThis.fetch=async()=>deny();
require('node:net').Socket.prototype.connect=deny;
require('node:dgram').createSocket=deny;
const dns=require('node:dns');
for(const name of ['lookup','resolve','resolve4','resolve6'])dns[name]=deny;
for(const name of ['lookup','resolve','resolve4','resolve6'])dns.promises[name]=async()=>deny();
syncBuiltinESMExports();
globalThis.issue196NetworkGuard=Object.freeze({attempts:()=>attempts});
