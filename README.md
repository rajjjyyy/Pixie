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

## Installation Guide

### Prerequisites

| Tool | Minimum version |
|------|----------------|
| Python | 3.10 |
| Node.js | 18 |
| npm | 8 |
| Git | any |

### Install dependencies

Double-click **`install.bat`** and wait for it to finish. This will:

- Create a Python virtual environment at `backend/.venv`
- Install all Python packages (PyTorch, transformers, rembg, FastAPI …)
- Run `npm install` for the React frontend

> **GPU users:** Before running `install.bat`, install the CUDA-enabled PyTorch build from [pytorch.org](https://pytorch.org/get-started/locally/). The CPU build is used by default.

You only need to do this once. Skip it on future launches unless you delete the `backend/.venv` folder or `frontend/node_modules`.

---

## Run Guide

Double-click **`start.bat`**. Two terminal windows open automatically:

| Window title | What runs inside |
|---|---|
| **Pixie Backend** | `uvicorn` on `http://localhost:8000` |
| **Pixie Frontend** | Vite dev server on `http://localhost:5173` |

Your browser opens at `http://localhost:5173` after a few seconds.

> **First run note:** On the very first request with each AI model, the weights are downloaded automatically (RMBG-1.4 ≈ 100 MB, U²-Net ≈ 176 MB). Subsequent starts use the cached weights and are instant.

### Manual start (PowerShell — without start.bat)

Open **two separate PowerShell windows**:

```powershell
# Window 1 — backend
C:\Users\XXXXX\Pixie\backend\.venv\Scripts\uvicorn.exe app:app --host 127.0.0.1 --port 8000 --app-dir C:\Users\XXXXX\Pixie\backend
```

```powershell
# Window 2 — frontend
cd C:\Users\XXXXX\Pixie\frontend
npm run dev
```

Then open `http://localhost:5173` in your browser.

> **Important:** Always use two separate windows — not `;` on one line. Each server must stay in the foreground of its own window so Ctrl + C works correctly.

---

## Closing Guide

Closing the browser tab does **not** stop the servers — they keep running in the background and hold ports 8000 and 5173. Follow these steps to shut down cleanly.

### Option A — Close the terminal windows (recommended)

1. Find the **Pixie Backend** terminal window in the taskbar
2. Press **Ctrl + C** inside it — wait for `Shutting down.` to appear
3. Close that window
4. Find the **Pixie Frontend** terminal window
5. Press **Ctrl + C** inside it — wait for `VITE vX.X.X` to disappear
6. Close that window

### Option B — Kill by port from PowerShell (if windows are gone)

Open PowerShell and run:

```powershell
# Stop the backend (port 8000)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue

# Stop the frontend (port 5173)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue
```

### Verify nothing is still running

```powershell
# Should return nothing if both ports are free
Get-NetTCPConnection -LocalPort 8000, 5173 -ErrorAction SilentlyContinue
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

## Troubleshooting

### "Backend offline" banner appears in the UI

The frontend loaded but cannot reach the Python server.

**Step-by-step fix:**

1. Check whether uvicorn is running:
   ```powershell
   Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
   ```
2. If nothing is returned, the backend is not running. Start it:
   ```powershell
   C:\Users\XXXXX\Pixie\backend\.venv\Scripts\uvicorn.exe app:app --host 127.0.0.1 --port 8000 --app-dir C:\Users\XXXXX\Pixie\backend
   ```
3. If port 8000 is in use by a different process, kill it first:
   ```powershell
   Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
   ```
4. Refresh the browser — the banner should disappear within a few seconds.

---

### "Network Error" when clicking Remove Background

This means the HTTP request to the backend failed. Common causes:

| Cause | Fix |
|---|---|
| Backend not running | Follow the "Backend offline" steps above |
| Port 8000 blocked by firewall | Allow it: `netsh advfirewall firewall add rule name="Pixie" dir=in action=allow protocol=TCP localport=8000` |
| Wrong port in Vite proxy | Check `frontend/vite.config.js` — target must be `http://localhost:8000` |

---

### "rembg — No onnxruntime backend found"

The rembg package was installed without its ONNX runtime dependency.

```powershell
C:\Users\XXXXX\Pixie\backend\.venv\Scripts\pip.exe install "rembg[cpu]"
```

Use `rembg[gpu]` instead if you have an NVIDIA GPU with CUDA.

---

### 401 — "You are trying to access a gated repo" (BRIA RMBG-2.0)

`briaai/RMBG-2.0` requires accepting a commercial licence before it can be downloaded. The default model is already set to the open-access **RMBG-1.4**, so this error only appears if you manually set `MODEL_ID` back to RMBG-2.0.

**To use RMBG-2.0 legitimately:**

1. Create a free account at [huggingface.co](https://huggingface.co)
2. Go to [huggingface.co/briaai/RMBG-2.0](https://huggingface.co/briaai/RMBG-2.0) and click **Agree and access repository**
3. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) → **New token** (type: Read)
4. Create `backend/.env` (this file is git-ignored):
   ```env
   HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. Restart the backend — it will now load RMBG-2.0 automatically

---

### Code changes not taking effect after editing Python files

Python is loaded once at startup. File changes on disk are ignored by a running server **unless** `--reload` is active.

**Step-by-step restart:**

1. Find the **Pixie Backend** terminal window
2. Press **Ctrl + C** — wait for the prompt to return
3. Press the **Up arrow** to recall the last command and press **Enter**

Or kill and relaunch from PowerShell:
```powershell
# Kill the old process
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force

# Start fresh
C:\Users\XXXXX\Pixie\backend\.venv\Scripts\uvicorn.exe app:app --host 127.0.0.1 --port 8000 --app-dir C:\Users\XXXXX\Pixie\backend
```

---

### Port already in use on startup

```
ERROR: [Errno 10048] error while attempting to bind on address ('127.0.0.1', 8000)
```

A previous server session was not closed cleanly.

```powershell
# Find and kill whatever is holding port 8000
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force

# Same for the frontend port if needed
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -Force
```

---

### Virtual environment not found (start.bat error)

`install.bat` was not run, or the venv was deleted.

```powershell
cd C:\Users\XXXXX\Pixie\backend
python -m venv .venv
.\.venv\Scripts\pip.exe install -r requirements.txt
```

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
