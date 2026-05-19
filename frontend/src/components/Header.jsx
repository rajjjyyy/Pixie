import styles from './Header.module.css'

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <img src="/Pixie-Icon.png" alt="Pixie" width="38" height="38" style={{ borderRadius: '8px' }} />
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
