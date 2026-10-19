// Server-only Supabase SDK adapters for the DISABLED deletion coordinator.
// No Supabase SDK is imported here or added to a public bundle. All clients
// MUST be constructed by a future audited server entrypoint, never the browser.
// Current supabase/functions/account-delete/index.ts remains hard-coded 503.
const UID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const JPEG=/^[a-f0-9]{64}\.jpg$/;
const BUCKET='closet-private';
function checkUser(uid){
 if(typeof uid!=='string'||!UID.test(uid))throw Error('Invalid verified owner');
 return uid.toLowerCase();
}
function successful(response,step){
 if(!response||response.error)throw Error('Supabase deletion step failed: '+step);
 return response.data;
}
function adminUser(response,step){
 const data=successful(response,step);
 const user=data?.user;
 if(!user||typeof user.id!=='string'||!UID.test(user.id))
  throw Error('Missing verified account identity: '+step);
 return user;
}
export function createSupabaseDeletionAdapters({adminClient,passwordClient}={}){
 if(typeof adminClient?.auth?.getUser!=='function'||
  typeof adminClient?.auth?.admin?.getUserById!=='function'||
  typeof adminClient?.auth?.admin?.deleteUser!=='function'||
  typeof adminClient?.rpc!=='function'||
  typeof adminClient?.storage?.from!=='function'||
  typeof adminClient?.from!=='function'||
  typeof passwordClient?.auth?.signInWithPassword!=='function'||
  adminClient===passwordClient)
  throw Error('Missing separate, server-only Supabase Auth and admin adapters');
 const store=adminClient.storage.from(BUCKET);
 if(typeof store?.list!=='function'||typeof store?.remove!=='function')
  throw Error('Missing private Supabase Storage API');
 return Object.freeze({
  async verifySession(bearer){
   if(typeof bearer!=='string'||bearer.length<20)throw Error('Missing bearer');
   // getUser(token) requests the live Auth server; no locally decoded JWT,
   // caller-supplied user_id, or editable user_metadata is trusted.
   const user=adminUser(await adminClient.auth.getUser(bearer),'verify-bearer');
   return checkUser(user.id);
  },
  async verifyPassword(uid,password){
   uid=checkUser(uid);
   if(typeof password!=='string'||password.length<8)throw Error('Invalid reauthentication');
   // Admin's trusted identity supplies the email, never the request body.
   const owner=adminUser(await adminClient.auth.admin.getUserById(uid),'identity-email');
   if(owner.id.toLowerCase()!==uid||typeof owner.email!=='string'||!owner.email)
    throw Error('Authenticated email identity unavailable');
   // passwordClient must be isolated (persistSession:false,
   // autoRefreshToken:false); no session mutation in an existing client.
   const signedIn=successful(await passwordClient.auth.signInWithPassword({
    email:owner.email,password
   }),'reauthenticate-password');
   if(typeof signedIn?.user?.id!=='string'||signedIn.user.id.toLowerCase()!==uid||
      typeof signedIn?.session?.access_token!=='string'||!signedIn.session.access_token)
    throw Error('Recent password proof belongs to a different user');
   return uid;
  },
  async lockWrites(uid){
   uid=checkUser(uid);
   // RPC is *only* service-role executable in the undeployed SQL design.
   return successful(await adminClient.rpc('begin_closet_account_deletion',{
    p_owner:uid
   }),'durable-write-lock')===true;
  },
  async listPhotos(uid,limit){
   uid=checkUser(uid);
   if(!Number.isInteger(limit)||limit<1||limit>100)
    throw Error('Unsafe private Storage batch limit');
   // Storage .list returns names relative to uid/ prefix. Malformed names
   // or nested paths stop full-account deletion rather than being skipped.
   const objects=successful(await store.list(uid,{
    limit,offset:0,sortBy:{column:'name',order:'asc'}
   }),'list-private-photos');
   if(!Array.isArray(objects)||objects.length>limit)
    throw Error('Unexpected private photo listing');
   const names=objects.map(item=>item?.name);
   if(names.some(name=>typeof name!=='string'||!JPEG.test(name))||
      new Set(names).size!==names.length)
    throw Error('Unrecognized private photo paths require manual review');
   return names;
  },
  async removePhotos(uid,paths){
   uid=checkUser(uid);
   if(!Array.isArray(paths)||!paths.length||paths.length>100||
      paths.some(path=>typeof path!=='string'||
       !path.startsWith(uid+'/')||!JPEG.test(path.slice(uid.length+1)))||
      new Set(paths).size!==paths.length)
    throw Error('Unsafe private-photo deletion scope');
   const response=await store.remove(paths);
   successful(response,'remove-private-photos');
   // Coordinator re-lists and verifies actual disappearance.
  },
  async deleteBackup(uid){
   uid=checkUser(uid);
   const op=adminClient.from('closet_backups').delete().eq('owner_id',uid);
   successful(await op,'delete-private-backup');
  },
  async hasBackup(uid){
   uid=checkUser(uid);
   const rows=successful(await adminClient.from('closet_backups')
    .select('owner_id').eq('owner_id',uid).limit(1),'verify-private-backup');
   if(!Array.isArray(rows)||rows.length>1||
      rows.some(row=>row?.owner_id!==uid))
    throw Error('Unexpected private backup verification');
   return rows.length!==0;
  },
  async deleteUser(uid){
   uid=checkUser(uid);
   successful(await adminClient.auth.admin.deleteUser(uid),'delete-auth-user');
  },
  async verifyUserDeleted(uid){
   uid=checkUser(uid);
   const result=await adminClient.auth.admin.getUserById(uid);
   // The Auth API's explicit 404 is the only acceptable deletion proof.
   // Network failures, permissions errors and malformed 200s are NOT proof.
   if(result?.error?.status===404)return true;
   if(result?.error)throw Error('Could not verify Auth deletion');
   return false;
  }
 });
}
