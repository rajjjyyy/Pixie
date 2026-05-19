import { useState, useCallback, useEffect } from 'react'
import axios from 'axios'
import Header from './components/Header'
import ImageUploader from './components/ImageUploader'
import ModelSelector from './components/ModelSelector'
import ResultPanel from './components/ResultPanel'
import styles from './App.module.css'

export default function App() {
  const [originalFile, setOriginalFile] = useState(null)
  const [originalURL, setOriginalURL]   = useState(null)
  const [resultURL, setResultURL]       = useState(null)
  const [resultBlob, setResultBlob]     = useState(null)
  const [model, setModel]               = useState('bria')
  const [status, setStatus]             = useState('idle') // idle | processing | done | error
  const [errorMsg, setErrorMsg]         = useState('')
  const [progress, setProgress]         = useState(0)
  const [backendOnline, setBackendOnline] = useState(null) // null=checking, true, false

  // Ping the backend health endpoint so we surface "server offline" clearly.
  useEffect(() => {
    axios.get('/api/health', { timeout: 5000 })
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false))
  }, [])

  const handleFileAccepted = useCallback((file) => {
    setOriginalFile(file)
    setOriginalURL(URL.createObjectURL(file))
    setResultURL(null)
    setResultBlob(null)
    setStatus('idle')
    setErrorMsg('')
    setProgress(0)
  }, [])

  const handleRemove = async () => {
    if (!originalFile) return
    setStatus('processing')
    setProgress(0)
    setResultURL(null)
    setResultBlob(null)
    setErrorMsg('')

    const formData = new FormData()
    formData.append('file', originalFile)
    formData.append('model', model)

    try {
      // Do NOT set Content-Type manually — axios must auto-set it with the
      // multipart boundary string, otherwise FastAPI cannot parse the fields.
      const res = await axios.post('/api/remove-background', formData, {
        responseType: 'blob',
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 50))
        },
      })
      setProgress(100)
      const blob = new Blob([res.data], { type: 'image/png' })
      setResultBlob(blob)
      setResultURL(URL.createObjectURL(blob))
      setStatus('done')
    } catch (err) {
      // When responseType:'blob', error responses also arrive as Blobs.
      // We must read the blob as text first to extract the JSON detail.
      let msg = err.message || 'Unknown error'
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text()
          const json = JSON.parse(text)
          msg = json.detail || json.error || text || msg
        } catch {
          // blob wasn't JSON — use the raw axios message
        }
      } else if (err.response?.data) {
        msg = err.response.data.detail || err.response.data.error || msg
      }
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg))
      setStatus('error')
    }
  }

  const handleDownload = () => {
    if (!resultBlob) return
    const a = document.createElement('a')
    const baseName = originalFile?.name?.replace(/\.[^.]+$/, '') || 'image'
    a.href = URL.createObjectURL(resultBlob)
    a.download = `${baseName}_no_bg.png`
    a.click()
  }

  const handleReset = () => {
    setOriginalFile(null)
    setOriginalURL(null)
    setResultURL(null)
    setResultBlob(null)
    setStatus('idle')
    setErrorMsg('')
    setProgress(0)
  }

  return (
    <div className={styles.layout}>
      <Header />

      {backendOnline === false && (
        <div className={styles.offlineBanner}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          Backend offline — make sure the Python server is running on port 8000.
          Start it with <code>start.bat</code> or run{' '}
          <code>uvicorn app:app --port 8000</code> inside <code>backend/</code>.
        </div>
      )}

      <main className={styles.main}>
        <section className={styles.controlPane}>
          <ImageUploader
            onFileAccepted={handleFileAccepted}
            originalURL={originalURL}
            status={status}
            onReset={handleReset}
          />

          <ModelSelector model={model} onChange={setModel} disabled={status === 'processing'} />

          <button
            className={styles.removeBtn}
            onClick={handleRemove}
            disabled={!originalFile || status === 'processing'}
          >
            {status === 'processing' ? (
              <>
                <span className={styles.spinner} />
                Processing…
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
                Remove Background
              </>
            )}
          </button>

          {status === 'processing' && (
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          )}

          {status === 'error' && (
            <div className={styles.errorBanner}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {errorMsg}
            </div>
          )}
        </section>

        <ResultPanel
          originalURL={originalURL}
          resultURL={resultURL}
          status={status}
          onDownload={handleDownload}
        />
      </main>
    </div>
  )
}
