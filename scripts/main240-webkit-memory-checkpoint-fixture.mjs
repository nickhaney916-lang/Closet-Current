/**
 * M240 research-only bounded in-flight memory checkpoints. This runs ONLY in
 * the disposable P101 native browser test Worker. It retains M239's genuine
 * JS grow target references and reads only Memory.buffer.byteLength; never
 * copies data, captures error messages, owner IDs, URLs, image or tensor data.
 * A blocked JS/WASM thread can suppress timers: absence of a checkpoint is
 * NOT evidence of no native growth, no stall, or safe WebKit behavior.
 */
export const M240_WORKER_PROBE=