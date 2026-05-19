import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import styles from './ImageUploader.module.css'

const ACCEPTED = { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'] }
const MAX_SIZE = 20 * 1024 * 1024 // 20 MB

export default function ImageUploader({ onFileAccepted, originalURL, status, onReset }) {
  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) onFileAccepted(accepted[0])
  }, [onFileAccepted])

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } =
    useDropzone({
      onDrop,
      accept: ACCEPTED,
      maxFiles: 1,
      maxSize: MAX_SIZE,
      disabled: status === 'processing',
    })

  const rejection = fileRejections[0]?.errors[0]

  return (
    <div className={styles.wrapper}>
      <label className={styles.sectionLabel}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        Source Image
      </label>

      {originalURL ? (
        <div className={styles.previewWrapper}>
          <img src={originalURL} alt="Original" className={styles.preview} />
          <div className={styles.previewOverlay}>
            <button
              className={styles.changeBtn}
              onClick={onReset}
              disabled={status === 'processing'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Change Image
            </button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={[
            styles.dropzone,
            isDragActive  ? styles.dragActive  : '',
            isDragReject  ? styles.dragReject   : '',
          ].join(' ')}
        >
          <input {...getInputProps()} />
          <div className={styles.dropContent}>
            <div className={styles.uploadIcon}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            {isDragActive ? (
              <p className={styles.dropText}>Drop it here!</p>
            ) : (
              <>
                <p className={styles.dropText}>Drag &amp; drop an image</p>
                <p className={styles.dropSubtext}>or <span className={styles.browseLink}>browse</span> to upload</p>
              </>
            )}
            <p className={styles.dropFormats}>JPG, PNG, WEBP, BMP, TIFF · max 20 MB</p>
          </div>
        </div>
      )}

      {rejection && (
        <p className={styles.rejectMsg}>
          {rejection.code === 'file-too-large'
            ? 'File exceeds 20 MB limit.'
            : rejection.code === 'file-invalid-type'
            ? 'Unsupported file type.'
            : rejection.message}
        </p>
      )}
    </div>
  )
}
