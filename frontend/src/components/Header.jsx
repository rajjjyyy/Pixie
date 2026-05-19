import styles from './Header.module.css'

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00c8ff"/>
                  <stop offset="100%" stopColor="#5b6af0"/>
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#lg1)" opacity="0.15"/>
              <path d="M8 24 L16 8 L24 24" stroke="url(#lg1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.5 19.5 L21.5 19.5" stroke="url(#lg1)" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="23" cy="10" r="3" fill="url(#lg1)" opacity="0.8"/>
            </svg>
          </span>
          <span className={styles.wordmark}>Pixie</span>
          <span className={styles.badge}>AI</span>
        </div>

        <nav className={styles.nav}>
          <span className={styles.tagline}>Background Remover · Powered by BiRefNet &amp; U²-Net</span>
        </nav>
      </div>

      {/* Neon bottom border */}
      <div className={styles.borderGlow} />
    </header>
  )
}
