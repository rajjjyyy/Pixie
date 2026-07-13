"""
Pixie — Background Removal Backend
FastAPI server exposing POST /api/remove-background
"""

from __future__ import annotations

import atexit
import io
import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from posthog import Posthog

from remover import BiRefNetRemover, RembgRemover

load_dotenv()

posthog_client = Posthog(
    os.getenv("POSTHOG_PROJECT_TOKEN", ""),
    host=os.getenv("POSTHOG_HOST", "https://us.i.posthog.com"),
    enable_exception_autocapture=True,
)
atexit.register(posthog_client.shutdown)

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger("pixie")

# ── Model singletons (loaded once at startup) ──────────────────────────────

_birefnet: BiRefNetRemover | None = None
_rembg:    RembgRemover    | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-warm both models on startup so the first request is fast."""
    global _rembg, _birefnet
    log.info("Pre-loading rembg/U²-Net…")
    _rembg = RembgRemover()
    log.info("Pre-loading BiRefNet-general…")
    _birefnet = BiRefNetRemover()
    yield
    log.info("Shutting down.")
    posthog_client.flush()


app = FastAPI(title="Pixie Background Remover", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)


# ── Health check ───────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok"}


# ── Main endpoint ──────────────────────────────────────────────────────────

@app.post("/api/remove-background")
async def remove_background(
    file: UploadFile = File(...),
    model: str       = Form("bria"),
):
    global _birefnet, _rembg

    # ── Validate content type
    if file.content_type and not file.content_type.startswith("image/"):
        posthog_client.capture(
            "anonymous",
            "invalid_file_uploaded",
            properties={"reason": "invalid_content_type", "status_code": 400, "$process_person_profile": False},
        )
        raise HTTPException(status_code=400, detail="Uploaded file is not an image.")

    raw = await file.read()
    if len(raw) == 0:
        posthog_client.capture(
            "anonymous",
            "invalid_file_uploaded",
            properties={"reason": "empty_file", "status_code": 400, "$process_person_profile": False},
        )
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(raw) > 20 * 1024 * 1024:
        posthog_client.capture(
            "anonymous",
            "invalid_file_uploaded",
            properties={"reason": "file_too_large", "file_size_bytes": len(raw), "status_code": 413, "$process_person_profile": False},
        )
        raise HTTPException(status_code=413, detail="File exceeds 20 MB limit.")

    model = model.strip().lower()
    log.info("Processing '%s' with model='%s' (%d bytes)", file.filename, model, len(raw))

    posthog_client.capture(
        "anonymous",
        "background_removal_requested",
        properties={"model": model, "file_size_bytes": len(raw), "$process_person_profile": False},
    )

    try:
        if model == "bria":
            if _birefnet is None:
                _birefnet = BiRefNetRemover()
            png_bytes = _birefnet.remove(raw)

        elif model == "rembg":
            if _rembg is None:
                _rembg = RembgRemover()
            png_bytes = _rembg.remove(raw)

        else:
            raise HTTPException(status_code=400, detail=f"Unknown model '{model}'. Use 'bria' or 'rembg'.")

    except HTTPException:
        raise
    except Exception as exc:
        log.exception("Background removal failed")
        posthog_client.capture(
            "anonymous",
            "background_removal_failed",
            properties={"model": model, "file_size_bytes": len(raw), "error_type": type(exc).__name__, "$process_person_profile": False},
        )
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    posthog_client.capture(
        "anonymous",
        "background_removal_succeeded",
        properties={"model": model, "file_size_bytes": len(raw), "output_size_bytes": len(png_bytes), "$process_person_profile": False},
    )

    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={"Content-Disposition": 'inline; filename="result.png"'},
    )
