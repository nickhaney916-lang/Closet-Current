"""P797 bounded *research* SAM2 memory/IO assertions. Synthetic byte fixtures only."""
import hashlib
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest
from PIL import Image

path=Path("research/mission1-bounded-sam2-797/bounded_source_io.py")
spec=importlib.util.spec_from_file_location("bounded_m1_797",path)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class FakeResponse:
    status=200
    url="https://cas-bridge.xethub.hf.co/fake-identity"
    def __init__(self,body,headers=None):
        self.file=io.BytesIO(body)
        self.headers=headers if headers is not None else {}
        self.max_read=0
        self.read_count=0
    def __enter__(self):return self
    def __exit__(self,*args):return False
    def read(self,n):
        if not isinstance(n,int) or n>mod.CHUNK:
            raise AssertionError("Checkpoint response attempted an unbounded read")
        self.max_read=max(self.max_read,n)
        self.read_count+=1
        return self.file.read(n)

class BoundedSourceMemory797(unittest.TestCase):
    URL="https://huggingface.co/cstr/sam2.1-hiera-tiny-ONNX/resolve/8cef213/decoder.onnx"
    def test_correct_checkpoint_is_streamed_sha_checked_and_atomically_installed(self):
        body=b"O"* (mod.CHUNK+321)
        response=FakeResponse(body)
        with tempfile.TemporaryDirectory() as folder:
            target=Path(folder)/"decoder.onnx"
            result=mod.stream_exact_checkpoint(
                self.URL,hashlib.sha256(body).hexdigest(),target,3*mod.CHUNK,
                opener=lambda request,timeout:response)
            self.assertEqual(result,target)
            self.assertEqual(mod.hash_file(target),hashlib.sha256(body).hexdigest())
            self.assertEqual(response.max_read,mod.CHUNK)
            self.assertGreaterEqual(response.read_count,3)
            self.assertFalse(list(Path(folder).glob("*.partial")))
    def test_wrong_model_sha_rejects_and_deletes_unverified_partial_bytes(self):
        body=b"on-device research model synthetic bytes"*700
        with tempfile.TemporaryDirectory() as folder:
            target=Path(folder)/"encoder.onnx"
            with self.assertRaisesRegex(RuntimeError,"SHA mismatch"):
                mod.stream_exact_checkpoint(self.URL,"f"*64,target,3*mod.CHUNK,
                    opener=lambda req,timeout:FakeResponse(body))
            self.assertFalse(target.exists())
            self.assertFalse(list(Path(folder).glob("*.partial")))
    def test_oversized_advertised_checkpoint_fails_before_local_allocation(self):
        with tempfile.TemporaryDirectory() as folder:
            target=Path(folder)/"decoder.onnx"
            response=FakeResponse(b"some bytes",{"Content-Length":str(mod.CHUNK+1)})
            with self.assertRaisesRegex(RuntimeError,"exceeds byte budget"):
                mod.stream_exact_checkpoint(self.URL,"f"*64,target,mod.CHUNK,
                    opener=lambda req,timeout:response)
            self.assertEqual(response.read_count,0)
            self.assertFalse(target.exists())
    def test_oversized_actual_body_fails_at_byte_cap_and_cleans_temp(self):
        body=b"p"*(mod.CHUNK+1)
        with tempfile.TemporaryDirectory() as folder:
            target=Path(folder)/"decoder.onnx"
            with self.assertRaisesRegex(RuntimeError,"exceeds byte budget"):
                mod.stream_exact_checkpoint(self.URL,"f"*64,target,mod.CHUNK,
                    opener=lambda req,timeout:FakeResponse(body))
            self.assertFalse(target.exists())
            self.assertFalse(list(Path(folder).glob("*.partial")))
    def test_non_hf_response_redirect_not_accepted_even_with_correct_sha(self):
        body=b"p"*2000
        with tempfile.TemporaryDirectory() as folder:
            response=FakeResponse(body)
            response.url="https://evil.example.net/download"
            target=Path(folder)/"model.onnx"
            with self.assertRaisesRegex(RuntimeError,"refused model response"):
                mod.stream_exact_checkpoint(self.URL,hashlib.sha256(body).hexdigest(),
                    target,mod.CHUNK,opener=lambda req,timeout:response)
            self.assertFalse(target.exists())
    def test_missing_or_invalid_cached_model_cannot_be_returned(self):
        with tempfile.TemporaryDirectory() as folder:
            (Path(folder)/"decoder.onnx").write_bytes(b"not-an-ONNX-file")
            # The corrupt cache MUST NOT skip the pinned HTTPS retrieval.
            with self.assertRaisesRegex(RuntimeError,"SHA mismatch"):
                mod.load_model_checkpoint("decoder.onnx",folder,
                     opener=lambda req,timeout:FakeResponse(b"not-an-ONNX-file"*200))
            self.assertFalse((Path(folder)/"decoder.onnx").exists())
    def test_original_jpeg_is_sha_verified_and_decoded_without_buffering_jpeg_body(self):
        with tempfile.TemporaryDirectory() as folder:
            im=Image.new("RGB",(96,128),(22,77,111))
            file=Path(folder)/"original.jpg"
            im.save(file,format="JPEG")
            meta={"file_name":"original.jpg",
                  "sha256":mod.hash_file(file),"width":96,"height":128}
            opened=mod.open_source_once(meta,folder)
            self.assertEqual(opened.size,(96,128))
            opened.close()
            with self.assertRaisesRegex(RuntimeError,"source SHA mismatch"):
                mod.open_source_once({**meta,"sha256":"a"*64},folder)
    def test_linux_process_rss_receipt_is_bounded_metadata_not_a_photo(self):
        receipt=mod.linux_process_memory_mib()
        self.assertEqual(set(receipt),{"VmRSSMiB","VmHWMMiB"})
        self.assertTrue(all(v is None or (isinstance(v,float) and v>0) for v in receipt.values()))

if __name__=="__main__":
    unittest.main()
