# Pixie — AI Background Remover

A locally-run, privacy-first background removal tool. Drop in an image, pick an AI model, and get a transparent-background PNG — no cloud, no subscriptions.

Built with a **React** frontend (dark / neon-blue theme) and a **Python FastAPI** backend.

![Pixie UI preview](docs/preview.png)

---

## Features

- **Two AI models** — BRIA RMBG-1.4 and rembg / U²-Net
- **Drag-and-drop** image upload (JPG, PNG, WEBP, BMP, TIFF · max 20 MB)
- **Split / Original / Result** preview panel
- **One-click PNG download** with transparent background
- **GPU acceleration** automatically used when CUDA is available
- All processing happens **100% locally** — images never leave your machine

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| Python | 3.10 |
| Node.js | 18 |
| npm | 8 |
| Git | any |

---

## Quick Start

### 1 — Install dependencies

Double-click **`install.bat`** (or run it from a terminal). This will:

- Create a Python virtual environment in `backend/.venv`
- Install all Python packages (PyTorch, transformers, rembg, FastAPI …)
- Run `npm install` for the React frontend

> **GPU users:** Before running `install.bat`, install the CUDA-enabled build of PyTorch from [pytorch.org](https://pytorch.org/get-started/locally/). The CPU build is installed by default.

### 2 — Launch

Double-click **`start.bat`**. It will:

1. Start the Python backend on `http://localhost:8000`
2. Start the React frontend on `http://localhost:5173`
3. Open your browser automatically

---

## Manual Start (PowerShell)

```powershell
# Terminal 1 — backend
C:\...\Pixie\backend\.venv\Scripts\uvicorn.exe app:app --host 127.0.0.1 --port 8000 --app-dir C:\...\Pixie\backend

# Terminal 2 — frontend
cd C:\...\Pixie\frontend
npm run dev
```

---

## AI Models

### BRIA RMBG-1.4 *(default)*

- Open-source, **MIT licensed**
- No authentication required — downloads automatically on first use (~100 MB)
- Excellent on portraits, products, and complex backgrounds

### BRIA RMBG-2.0 *(optional upgrade)*

- State-of-the-art accuracy, gated licence
- Requires a HuggingFace account + accepting the model terms at  
  [huggingface.co/briaai/RMBG-2.0](https://huggingface.co/briaai/RMBG-2.0)
- To enable, create `backend/.env` and add your token:

```env
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Then install `python-dotenv` and load it at the top of `backend/app.py`:

```python
from dotenv import load_dotenv
load_dotenv()
```

### rembg / U²-Net

- Open-source, MIT licensed
- Lightweight and fast
- U²-Net weights (~176 MB) downloaded automatically on first server start

---

## Project Structure

```
Pixie/
├── install.bat             # One-click dependency installer (Windows)
├── start.bat               # One-click launcher (Windows)
│
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css       # Global dark/neon-blue CSS variables
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── ImageUploader.jsx
│   │       ├── ModelSelector.jsx
│   │       └── ResultPanel.jsx
│   ├── vite.config.js      # Dev proxy: /api → localhost:8000
│   └── package.json
│
└── backend/                # Python FastAPI server
    ├── app.py              # API routes
    ├── remover.py          # BriaRemover + RembgRemover classes
    └── requirements.txt
```

---

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Backend liveness check |
| `POST` | `/api/remove-background` | Remove background, returns PNG |

**POST `/api/remove-background`** — `multipart/form-data`

| Field | Type | Values |
|-------|------|--------|
| `file` | image file | JPG, PNG, WEBP, BMP, TIFF |
| `model` | string | `bria` (default) · `rembg` |

Returns: `image/png` with transparent background.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, CSS Modules |
| Backend | Python 3.10+, FastAPI, Uvicorn |
| AI (BRIA) | HuggingFace Transformers, PyTorch, torchvision |
| AI (rembg) | rembg, ONNX Runtime |
| Image I/O | Pillow, NumPy, OpenCV |

---

## Licence

This project's code is released under the **MIT License**.  
Model weights carry their own licences — see the respective HuggingFace model cards.
