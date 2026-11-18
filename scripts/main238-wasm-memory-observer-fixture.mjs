/**
 * M238 research-only pass-through WASM instance/imported-memory references.
 * No memory contents, source photos, model weights, users, URLs or errors logged.
 * Unlike M230/M237 JS Memory.grow counters, a held WebAssembly.Memory reference
 * permits read-only byteLength snapshots across WASM-internal memory.grow.
 * If the ORT instance neither imports nor exports memory, telemetry reports
 * zero references honestly; it does NOT claim no internal growth.
 */
export const M238_WORKER_PROBE=String.raw