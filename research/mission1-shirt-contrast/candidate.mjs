// Research-only candidate. Never changes owner labels or save admission.
export const contrastPrompts = Object.freeze({
  "a T-shirt": "a lightweight jersey T-shirt with a simple sewn bottom hem and plain sleeve hems, short or long sleeved",
  "a sweatshirt": "a heavier knit or fleece pullover sweatshirt, typically with ribbed cuffs and a ribbed bottom waistband"
});
export function contrastCatalog(catalog) {
  return catalog.map(c => ({...c, label: contrastPrompts[c.label] ?? c.label}));
}
export function restoreCanonicalScores(results) {
  const reverse = new Map(Object.entries(contrastPrompts).map(([a,b])=>[b,a]));
  return results.map(r=>({...r,label:reverse.get(r.label) ?? r.label}));
}
