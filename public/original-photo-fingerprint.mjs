/**
 * Pure local original-photo fingerprint helper.
 * Caller supplies actual original-photo bytes. Never hashes a crop or preview.
 * No network, storage, or customer access. SHA-256 Web Crypto required.
 */
export async function fingerprintOriginalPhoto(originalBytes,cryptoProvider=globalThis.crypto){
 if(!(originalBytes instanceof Uint8Array)||originalBytes.byteLength===0)throw Error('Nonempty original photo bytes required');
 if(!cryptoProvider?.subtle?.digest)throw Error('Secure SHA-256 digest unavailable');
 const input=new Uint8Array(originalBytes);
 const digest=await cryptoProvider.subtle.digest('SHA-256',input);
 const version=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 return {version,algorithm:'sha256',byteLength:input.byteLength};
}
