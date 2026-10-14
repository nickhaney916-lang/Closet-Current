#!/usr/bin/env python3
"""Regenerate pinned FashionCLIP vectors from its exported fp32 ONNX text model.
Optional prompt overrides replace only their named rows; all other rows retain
exact bytes from the validated production bundle. Outputs require photo testing.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def validate_overrides(overrides, labels):
    if not isinstance(overrides, dict) or not overrides:
        raise ValueError('Prompt overrides must be a nonempty object.')
    for label, aliases in overrides.items():
        if label not in labels or not isinstance(aliases, list) or not 2 <= len(aliases) <= 8:
            raise ValueError('Unknown label or invalid prompt ensemble: ' + str(label))
        if any(not isinstance(x, str) or not x.strip() or len(x) > 240 for x in aliases) or len(set(aliases)) != len(aliases) or aliases[0] != label:
            raise ValueError('Invalid prompt descriptions: ' + label)
    return overrides

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prompt-overrides', type=Path)
    parser.add_argument('--blend', type=float, help='Fraction of ensemble versus canonical prompt; defaults to current metadata or 1.')
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'public')
    args = parser.parse_args()
    import numpy as np
    import onnxruntime as ort
    from huggingface_hub import hf_hub_download
    from transformers import AutoTokenizer

    metadata = json.loads((ROOT / 'public/recognition-vectors.json').read_text())
    labels = metadata['labels']
    assert metadata['model'] == 'ff13/fashion-clip' and re.fullmatch(r'[a-f0-9]{40}', metadata['revision'])
    assert metadata['dimensions'] == 512 and len(set(labels)) == len(labels)
    source = (ROOT / 'public/recognition-vectors.bin').read_bytes()
    assert hashlib.sha256(source).hexdigest() == metadata['sha256']
    matrix = np.frombuffer(source, dtype='<f4').reshape(len(labels), 512).copy()
    raw_overrides = json.loads(args.prompt_overrides.read_text()) if args.prompt_overrides else metadata.get('promptEnsembles')
    overrides = validate_overrides(raw_overrides, labels) if raw_overrides else None
    blend = args.blend if args.blend is not None else (1.0 if args.prompt_overrides else metadata.get('promptBlend', 1.0))
    if not 0 < blend <= 1:
        parser.error('--blend must be greater than 0 and at most 1.')
    descriptions = overrides or {label: [label] for label in labels}
    text_path = hf_hub_download(metadata['model'], filename='onnx/text_model.onnx', revision=metadata['revision'])
    tokenizer = AutoTokenizer.from_pretrained(metadata['model'], revision=metadata['revision'])
    options = ort.SessionOptions()
    options.intra_op_num_threads = 2
    options.inter_op_num_threads = 1
    session = ort.InferenceSession(text_path, sess_options=options, providers=['CPUExecutionProvider'])
    names = [x.name for x in session.get_inputs()]
    output_names = [x.name for x in session.get_outputs()]
    assert 'text_embeds' in output_names, output_names
    prompts = [(label, alias) for label, aliases in descriptions.items() for alias in aliases]
    encoded = {label: [] for label in descriptions}
    for start in range(0, len(prompts), 32):
        batch = prompts[start:start+32]
        tokens = tokenizer(['A photo of ' + alias + '.' for _, alias in batch], padding=True, truncation=True, return_tensors='np')
        feed = {name: np.asarray(tokens[name], dtype=np.int64) for name in names}
        features = session.run(['text_embeds'], feed)[0]
        assert features.shape == (len(batch), 512) and np.isfinite(features).all()
        norms = np.linalg.norm(features, axis=1, keepdims=True)
        assert (norms > 1e-8).all()
        features = features / norms
        for (label, _), feature in zip(batch, features):
            encoded[label].append(feature)
    positions = {label: i for i, label in enumerate(labels)}
    for label, features in encoded.items():
        feature = np.mean(features, axis=0)
        norm = np.linalg.norm(feature)
        assert norm > 1e-8 and np.isfinite(feature).all()
        feature = (feature / norm) * blend + features[0] * (1 - blend)
        matrix[positions[label]] = feature / np.linalg.norm(feature)
    assert matrix.shape == (len(labels), 512) and np.isfinite(matrix).all()
    assert np.allclose(np.linalg.norm(matrix, axis=1), 1, atol=.001)
    payload = matrix.astype('<f4').tobytes()
    metadata['sha256'] = hashlib.sha256(payload).hexdigest()
    metadata['textDtype'] = 'fp32'
    metadata['textEncoder'] = 'onnx/text_model.onnx'
    metadata['promptEnsembles'] = overrides or {}
    metadata['promptBlend'] = blend
    args.output_dir.mkdir(parents=True, exist_ok=True)
    (args.output_dir / 'recognition-vectors.bin').write_bytes(payload)
    (args.output_dir / 'recognition-vectors.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print(f'Encoded {len(prompts)} prompts for {len(descriptions)} rows; {len(labels)} total labels. SHA256 {metadata["sha256"]}')

if __name__ == '__main__':
    main()
