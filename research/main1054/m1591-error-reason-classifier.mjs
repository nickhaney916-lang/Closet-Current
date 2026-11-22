/*
 * M1591 original-model research-only: bounded, non-sensitive WASM error categories.
 * Never log Worker error text, URLs, stack traces or arbitrary exceptions.
 * An error category is NOT native PC, original M279 correlation or causal repair.
 */
export function classifyM1591ErrorReason(name, message) {
  const text = typeof message === 'string' ? message.slice(0, 256) : '';
  if (/memory access out of bounds|out of bounds memory access/i.test(text))
    return 'WASM_MEMORY_BOUNDS';
  if (/table index.{0,24}out of bounds|out of bounds.{0,24}table/i.test(text))
    return 'WASM_TABLE_BOUNDS';
  if (/\bunreachable\b/i.test(text))
    return 'WASM_UNREACHABLE';
  if (/call stack size exceeded|maximum call stack|stack overflow/i.test(text))
    return 'STACK_EXHAUSTED';
  if (/out of memory|failed to allocate|allocation failed|cannot allocate memory/i.test(text))
    return 'MEMORY_RESOURCE';
  return name === 'RuntimeError' ? 'RUNTIME_OTHER' : 'NON_RUNTIME_OTHER';
}

/**
 * Return bounded numeric WASM function frames from an ordinary JS error stack.
 * Browser-reported locations are NOT native PCs, proven WASM file offsets,
 * or attributable ORT source positions. Never return raw stacks or URLs.
 */
export function parseM1591WasmStackFrames(stack) {
  const text=typeof stack==='string'?stack.slice(0,4096):'';
  return [...text.matchAll(/wasm-function\[(\d{1,6})\](?::(0x[0-9a-f]{1,10}))?/gi)]
    .slice(0,6)
    .map(m=>({functionIndex:Number(m[1]),
      stackLocationUnverified:m[2]?Number.parseInt(m[2],16):null}))
    .filter(f=>Number.isSafeInteger(f.functionIndex)&&f.functionIndex<=20000&&
      (f.stackLocationUnverified===null||
       Number.isSafeInteger(f.stackLocationUnverified)));
}
