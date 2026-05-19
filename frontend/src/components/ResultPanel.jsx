import { useState, useRef, useEffect } from 'react'
import styles from './ResultPanel.module.css'

const CHECKER_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Crect width='8' height='8' fill='%23141e30'/%3E%3Crect x='8' y='8' width='8' height='8' fill='%23141e30'/%3E%3Crect x='8' y='0' width='8' height='8' fill='%231a2744'/%3E%3Crect x='0' y='8' width='8' height='8' fill='%231a2744'/%3E%3C/svg%3E")`

export default function ResultPanel({ originalURL, resultURL, status, onDownload }) {
  const [view, setView] = useState('split') // 'split' | 'original' | 'result'

  const showTabs = originalURL && (resultURL || status === 'done')

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.sectionLabel}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18M9 21V9"/>
          </svg>
          Preview
        </span>

        {showTabs && (
          <div className={styles.viewTabs}>
            {['split', 'original', 'result'].map((v) => (
              <button
                key={v}
                className={[styles.tabBtn, view === v ? styles.tabActive : ''].join(' ')}
                onClick={() => setView(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        )}

        {resultURL && (
          <button className={styles.downloadBtn} onClick={onDownload}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Save PNG
          </button>
        )}
      </div>

      <div className={styles.canvas}>
        {/* Idle / no image */}
        {!originalURL && status === 'idle' && (
          <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <p className={styles.placeholderTitle}>Your result will appear here</p>
            <p className={styles.placeholderSub}>Upload an image and click Remove Background</p>
          </div>
        )}

        {/* Processing overlay */}
        {status === 'processing' && (
          <div className={styles.processingOverlay}>
            <div className={styles.pulseRing} />
            <div className={styles.pulseRing} style={{ animationDelay: '0.4s' }} />
            <div className={styles.pulseRing} style={{ animationDelay: '0.8s' }} />
            <div className={styles.processingIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <p className={styles.processingText}>Removing background…</p>
            <p className={styles.processingSubtext}>This may take a few seconds on first run</p>
          </div>
        )}

        {/* Split view */}
        {originalURL && view === 'split' && (
          <div className={styles.splitView}>
            <ImagePane label="Original" src={originalURL} showChecker={false} />
            {resultURL
              ? <ImagePane label="Result" src={resultURL} showChecker={true} />
              : <EmptyPane label="Result" status={status} />}
          </div>
        )}

        {/* Single views */}
        {originalURL && view === 'original' && (
          <ImagePane label="Original" src={originalURL} showChecker={false} fill />
        )}
        {resultURL && view === 'result' && (
          <ImagePane label="Result" src={resultURL} showChecker={true} fill />
        )}
      </div>
    </section>
  )
}

function ImagePane({ label, src, showChecker, fill }) {
  const [zoom, setZoom] = useState({ scale: 1, tx: 0, ty: 0 })
  const containerRef = useRef(null)

  // Reset zoom whenever a new image is loaded
  useEffect(() => {
    setZoom({ scale: 1, tx: 0, ty: 0 })
  }, [src])

  // Non-passive wheel listener so we can call preventDefault
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      setZoom(prev => {
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
        const newScale = Math.min(Math.max(prev.scale * factor, 0.25), 10)
        const ratio = newScale / prev.scale
        return {
          scale: newScale,
          tx: cx - (cx - prev.tx) * ratio,
          ty: cy - (cy - prev.ty) * ratio,
        }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <div
      ref={containerRef}
      className={[styles.pane, fill ? styles.paneFill : ''].join(' ')}
      style={showChecker ? { backgroundImage: CHECKER_BG, backgroundSize: '16px 16px' } : {}}
    >
      <span className={styles.paneLabel}>{label}</span>
      <div
        className={styles.zoomWrapper}
        style={{
          transform: `translate(${zoom.tx}px, ${zoom.ty}px) scale(${zoom.scale})`,
          transformOrigin: '0 0',
        }}
      >
        <img src={src} alt={label} className={styles.paneImg} />
      </div>
    </div>
  )
}

function EmptyPane({ label, status }) {
  return (
    <div className={styles.pane}>
      <span className={styles.paneLabel}>{label}</span>
      <div className={styles.emptyPaneContent}>
        {status === 'processing'
          ? <span className={styles.spinnerLg} />
          : <p className={styles.emptyPaneText}>Awaiting result…</p>}
      </div>
    </div>
  )
}
