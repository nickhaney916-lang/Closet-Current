#!/usr/bin/env python3
"""Rebuild FashionCLIP text embeddings using the exact pinned model revision.
Requires: pip install torch transformers numpy
Run: python scripts/rebuild-recognition-vectors.py
"""
import hashlib
import json
from pathlib import Path
import numpy as np
import torch
from transformers import CLIPModel, CLIPTokenizer

ROOT = Path(__file__).resolve().parents[1]
manifest_path = ROOT / "public/recognition-vectors.json"
binary_path = ROOT / "public/recognition-vectors.bin"
metadata = json.loads(manifest_path.read_text())
assert metadata["model"] == "ff13/fashion-clip"
assert len(set(metadata["labels"])) == len(metadata["labels"])
model = CLIPModel.from_pretrained(metadata["model"], revision=metadata["revision"]).eval()
tokenizer = CLIPTokenizer.from_pretrained(metadata["model"], revision=metadata["revision"])
labels = metadata["labels"]
vectors = []
with torch.inference_mode():
    for start in range(0, len(labels), 32):
        batch = ["A photo of " + label + "." for label in labels[start:start+32]]
        tokens = tokenizer(batch, padding=True, truncation=True, return_tensors="pt")
        features = model.get_text_features(**tokens)
        # transformers may return an object rather than a tensor in newer versions
        if hasattr(features, "pooler_output"):
            features = features.pooler_output
        features = features / features.norm(dim=-1, keepdim=True)
        vectors.append(features.cpu().numpy().astype("<f4"))
matrix = np.concatenate(vectors, axis=0)
assert matrix.shape == (len(labels), 512), matrix.shape
payload = matrix.tobytes()
metadata["sha256"] = hashlib.sha256(payload).hexdigest()
metadata["scale"] = float(model.logit_scale.exp().item())
binary_path.write_bytes(payload)
manifest_path.write_text(json.dumps(metadata, indent=2) + "\n")
print(f"Regenerated {len(labels)} embeddings ({len(payload)} bytes), sha256={metadata['sha256']}")
