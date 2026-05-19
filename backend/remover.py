"""
remover.py — Background removal implementations for Pixie

Two backends:
  BriaRemover  → BRIA RMBG-1.4 by default (open-source, MIT licensed)
                 Set the HF_TOKEN environment variable to upgrade to
                 RMBG-2.0 (gated — requires accepting terms at
                 https://huggingface.co/briaai/RMBG-2.0)
  RembgRemover → rembg / U²-Net  (via rembg library)
"""

from __future__ import annotations

import io
import logging
import os
from typing import cast

import numpy as np
from PIL import Image

log = logging.getLogger("pixie.remover")


# ─────────────────────────────────────────────────────────────────────────────
#  BRIA RMBG
# ─────────────────────────────────────────────────────────────────────────────

class BriaRemover:
    """
    Uses a BRIA RMBG segmentation model from HuggingFace.

    Default model: briaai/RMBG-1.4  (open-access, MIT license)
    Upgrade model: briaai/RMBG-2.0  (gated — set HF_TOKEN env var after
                   accepting the licence at huggingface.co/briaai/RMBG-2.0)
    """

    MODEL_OPEN  = "briaai/RMBG-1.4"
    MODEL_GATED = "briaai/RMBG-2.0"

    def __init__(self) -> None:
        try:
            import torch
            from transformers import AutoModelForImageSegmentation
            from torchvision.transforms.functional import normalize
        except ImportError as exc:
            raise RuntimeError(
                "Required packages missing. Run: pip install transformers torch torchvision"
            ) from exc

        self._torch = torch
        self._normalize = normalize

        hf_token = os.environ.get("HF_TOKEN", "").strip() or None
        if hf_token:
            self.MODEL_ID = self.MODEL_GATED
            log.info("BRIA: HF_TOKEN found — loading RMBG-2.0")
        else:
            self.MODEL_ID = self.MODEL_OPEN
            log.info(
                "BRIA: loading RMBG-1.4 (open-access). "
                "Set HF_TOKEN to use the gated RMBG-2.0 instead."
            )

        self._device = "cuda" if torch.cuda.is_available() else "cpu"
        log.info("BRIA: running on %s", self._device)

        self._model = AutoModelForImageSegmentation.from_pretrained(
            self.MODEL_ID,
            trust_remote_code=True,
            token=hf_token,   # None is safe — HF ignores it for public models
        )
        self._model.to(self._device)
        self._model.eval()

        self._input_size = (1024, 1024)

    # ------------------------------------------------------------------

    def remove(self, image_bytes: bytes) -> bytes:
        torch = self._torch

        orig = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        rgb  = orig.convert("RGB")

        # Pre-process
        tensor = self._preprocess(rgb)

        with torch.no_grad():
            result = self._model(tensor)

        # The model returns a list; first element is the foreground mask logits.
        logits = result[0][0]  # shape: (1, H, W) or (H, W)
        if logits.ndim == 3:
            logits = logits.squeeze(0)

        mask_np = torch.sigmoid(logits).cpu().numpy()
        mask_img = Image.fromarray((mask_np * 255).astype(np.uint8)).resize(
            orig.size, Image.LANCZOS
        )

        # Apply mask as alpha channel
        rgba = orig.copy()
        rgba.putalpha(mask_img)

        buf = io.BytesIO()
        rgba.save(buf, format="PNG", optimize=False)
        return buf.getvalue()

    def _preprocess(self, img: Image.Image):
        torch = self._torch
        w, h  = self._input_size
        img   = img.resize((w, h), Image.BILINEAR)
        arr   = np.array(img, dtype=np.float32) / 255.0
        tensor = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0).to(self._device)
        tensor = self._normalize(tensor, [0.5, 0.5, 0.5], [1.0, 1.0, 1.0])
        return tensor


# ─────────────────────────────────────────────────────────────────────────────
#  rembg / U²-Net
# ─────────────────────────────────────────────────────────────────────────────

class RembgRemover:
    """
    Uses the rembg library (u2net model by default).
    Install: pip install rembg[gpu]  or  pip install rembg
    """

    def __init__(self) -> None:
        try:
            from rembg import new_session
            self._session = new_session("u2net")
        except ImportError as exc:
            raise RuntimeError(
                "rembg is not installed. Run: pip install rembg"
            ) from exc

    def remove(self, image_bytes: bytes) -> bytes:
        from rembg import remove as rembg_remove

        orig = Image.open(io.BytesIO(image_bytes))
        result: Image.Image = cast(Image.Image, rembg_remove(orig, session=self._session))

        # Ensure RGBA PNG output
        result = result.convert("RGBA")
        buf = io.BytesIO()
        result.save(buf, format="PNG", optimize=False)
        return buf.getvalue()
