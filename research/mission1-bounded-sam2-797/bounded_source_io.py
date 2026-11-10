"""P797 - bounded *research* SAM2 ONNX model download and source JPEG IO.

No network or private owner JPEGs beyond the immutable public model assets.
Never load entire 109.5-MB checkpoint into a Python bytes object.
No model adaptation, background daemon, production dependency or deployment.
"""
from hashlib import sha256
import os
from pathlib import Path
from tempfile import NamedTemporaryFile
from urllib.parse import urlsplit
from urllib.request import Request,urlopen
from PIL import Image

CHUNK=1024*1024
CAP_BYTES={"encoder.onnx":175*CHUNK,"decoder.onnx":40*CHUNK}
EXPECTED_MODEL_SHA={
 "encoder.onnx":"4fda6e68561e27808cedffa8689749a622bba5f11ba66f4ca4e3a8a9f6360db5",
 "decoder.onnx":"0ae944e08e55814c19afa4d143ef07b1a3dbad2decd77c15ec3ab220b9f57247"
}
REPO="cstr/sam2.1-hiera-tiny-ONNX"
REV="8cef213"

def hash_file(path):
    digest=sha256()
    with Path(path).open("rb") as f:
        while True:
            chunk=f.read(CHUNK)
            if not chunk:break
            digest.update(chunk)
    return digest.hexdigest()

def _allowed_host(url):
    u=urlsplit(url)
    h=(u.hostname or "").lower()
    return u.scheme=="https" and (
        h=="huggingface.co" or h.endswith(".xethub.hf.co") or h.endswith(".hf.co")
    )

def stream_exact_checkpoint(url,expected,destination,byte_cap,opener=None):
    """Accept ONLY pinned bytes from TLS Hugging Face hosts; atomic install.

    Streaming download holds at most CHUNK bytes of response data at once.
    Any interruption/limit/SHA error removes its temporary file, never
    replacing a verified checkpoint with a partial or corrupt one.
    """
    if opener is None:opener=urlopen
    destination=Path(destination)
    if not _allowed_host(url):
        raise RuntimeError("P797 SAM2 model URL must be HTTPS HuggingFace")
    if not isinstance(expected,str) or len(expected)!=64 or any(c not in "0123456789abcdef" for c in expected):
        raise RuntimeError("P797 pinned checkpoint digest invalid")
    if not isinstance(byte_cap,int) or not CHUNK<=byte_cap<=175*CHUNK:
        raise RuntimeError("P797 model budget invalid")
    destination.parent.mkdir(parents=True,exist_ok=True)
    temporary=None
    try:
        with opener(Request(url,headers={"User-Agent":"ClosetCurrentMission1-P797/1.0"}),timeout=180) as response:
            if response.status!=200 or not _allowed_host(response.url):
                # Never log signed query strings or access tokens.
                raise RuntimeError("P797 refused model response status or redirect")
            length=response.headers.get("Content-Length") if response.headers else None
            if length is not None and int(length)>byte_cap:
                raise RuntimeError("P797 pinned model exceeds byte budget")
            digest=sha256()
            count=0
            with NamedTemporaryFile(mode="wb",dir=destination.parent,
                                   prefix=".sam2-",suffix=".partial",delete=False) as tmp:
                temporary=Path(tmp.name)
                while True:
                    part=response.read(CHUNK)
                    if not part:break
                    count+=len(part)
                    if count>byte_cap:
                        raise RuntimeError("P797 pinned model exceeds byte budget")
                    digest.update(part)
                    tmp.write(part)
        if count<1024 or digest.hexdigest()!=expected:
            raise RuntimeError("P797 SAM2 ONNX SHA mismatch: cannot trust checkpoint")
        os.replace(temporary,destination)
        temporary=None
        return destination
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)

def load_model_checkpoint(name,directory,opener=None):
    if name not in EXPECTED_MODEL_SHA:
        raise RuntimeError("P797 unknown model asset")
    destination=Path(directory)/name
    expected=EXPECTED_MODEL_SHA[name]
    if destination.exists():
        if destination.stat().st_size<=CAP_BYTES[name] and hash_file(destination)==expected:
            return destination
        destination.unlink() # old invalid, oversized or corrupted asset
    url=f"https://huggingface.co/{REPO}/resolve/{REV}/{name}?download=true"
    return stream_exact_checkpoint(url,expected,destination,CAP_BYTES[name],opener=opener)

def open_source_once(row,root):
    """Verify original source-file SHA in CHUNK increments, then decode once."""
    path=Path(root)/row["file_name"]
    if not path.is_file() or hash_file(path)!=row["sha256"]:
        raise RuntimeError("Real publisher original JPEG bytes or source SHA mismatch")
    with Image.open(path) as source:
        image=source.convert("RGB")
    if image.size!=(row["width"],row["height"]) or min(image.size)<8 or max(image.size)>3072:
        raise RuntimeError("Actual publisher image dimensions invalid")
    return image

def linux_process_memory_mib():
    """Measured process resident and high-water usage, not simulated limits."""
    try:
        lines=Path("/proc/self/status").read_text().splitlines()
        data={}
        for name in ("VmRSS","VmHWM"):
            match=next((line for line in lines if line.startswith(name+":")),None)
            data[name+"MiB"]=round(int(match.split()[1])/1024,2) if match else None
        return data
    except (OSError,ValueError,IndexError,StopIteration):
        return {"VmRSSMiB":None,"VmHWMMiB":None}
