// Closet Current owner deletion — intentionally disabled in every environment.
// This is NOT a production endpoint. The pure orchestration lives in
// deletion-coordinator.mjs and is tested with synthetic accounts only.
// Before activation, owner must approve durable server-side per-user write
// locks enforced across BOTH closet_backups and Storage uploads, real
// reauthentication and tenant isolation, an audited administrator adapter,
// a recovery runbook, and actual account-deletion consent. See docs.
// DO NOT read or expose SUPABASE_SERVICE_ROLE_KEY in this disabled entrypoint.
Deno.serve(()=>new Response(JSON.stringify({
 error:'Account deletion is not available in this pilot build',
 deletionCompleted:false
}),{status:503,headers:{
 'Content-Type':'application/json',
 'Cache-Control':'no-store',
 'X-Content-Type-Options':'nosniff'
}}));
