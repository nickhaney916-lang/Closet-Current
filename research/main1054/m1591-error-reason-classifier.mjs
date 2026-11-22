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
