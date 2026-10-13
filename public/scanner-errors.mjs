export function scannerErrorCode(error,stage){
 const message=String(error?.message||'');
 if(/memory|alloc|out of bounds/i.test(message))return 'memory';
 if(/decode|jpeg|image/i.test(message))return 'image';
 if(/fetch|network|download|HTTP|404|403/i.test(message))return 'network';
 if(/wasm|webassembly|simd|onnx|kernel|unsupported/i.test(message))return 'runtime';
 return ['runtime_import','catalog_import'].includes(stage)?'asset':'unknown';
}
