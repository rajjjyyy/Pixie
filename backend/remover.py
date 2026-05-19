"""
remover.py — Background removal implementations for Pixie

Two backends:
  BiRefNetRemover → ZhengPeng7/BiRefNet-general via rembg
                    State-of-the-art quality, open-source, no authentication.
                    Weights (~200 MB) downloaded automatically on first use.

  RembgRemover    → rembg / U²-Net
                    Fast, lightweight open-source model.
                    Weights (~176 MB) downloaded automatically on first use.

Why not BRIA RMBG-1.4 / RMBG-2.0?
  • RMBG-2.0 is gated and requires HuggingFace authentication.
  • RMBG-1.4 is incompatible with transformers >= 4.41 — the BriaRMBG
    custom model class is missing the `all_tied_weights_keys` attribute
    introduced in that release. Since the model code lives on HuggingFace
    and has not been updated, there is no local fix.
  BiRefNet-general outperforms both on the DIS/HRSOD benchmarks and
  integrates cleanly through rembg without any compatibility concerns.
"""

from __future__ import annotations

import io
import logging
from typing import cast

from PIL import Image

log = logging.getLogger("pixie.remover")


# ─────────────────────────────────────────────────────────────────────────────
#  BiRefNet (high-quality model)
# ─────────────────────────────────────────────────────────────────────────────

class BiRefNetRemover:
    """
    High-quality background removal using ZhengPeng7/BiRefNet-general.
    Loaded through rembg — no transformers compatibility issues.
    """

    MODEL_NAME = "birefnet-general"

    def __init__(self) -> None:
        try:
            from rembg import new_session
        except ImportError as exc:
            raise RuntimeError(
                'rembg is not installed. Run: pip install "rembg[cpu]"'
            ) from exc

        log.info("BiRefNet: loading %s (first run downloads ~200 MB)…", self.MODEL_NAME)
        self._session = new_session(self.MODEL_NAME)
        log.info("BiRefNet ready.")

    def remove(self, image_bytes: bytes) -> bytes:
        from rembg import remove as rembg_remove

        orig = Image.open(io.BytesIO(image_bytes))
        result: Image.Image = cast(Image.Image, rembg_remove(orig, session=self._session))
        result = result.convert("RGBA")
        buf = io.BytesIO()
        result.save(buf, format="PNG", optimize=False)
        return buf.getvalue()


# ─────────────────────────────────────────────────────────────────────────────
#  rembg / U²-Net (fast model)
# ─────────────────────────────────────────────────────────────────────────────

class RembgRemover:
    """
    Fast background removal using rembg / U²-Net.
    Weights (~176 MB) are downloaded automatically on first server start.
    """

    def __init__(self) -> None:
        try:
            from rembg import new_session
            self._session = new_session("u2net")
        except ImportError as exc:
            raise RuntimeError(
                'rembg is not installed. Run: pip install "rembg[cpu]"'
            ) from exc

    def remove(self, image_bytes: bytes) -> bytes:
        from rembg import remove as rembg_remove

        orig = Image.open(io.BytesIO(image_bytes))
        result: Image.Image = cast(Image.Image, rembg_remove(orig, session=self._session))
        result = result.convert("RGBA")
        buf = io.BytesIO()
        result.save(buf, format="PNG", optimize=False)
        return buf.getvalue()
