import styles from './ModelSelector.module.css'

const MODELS = [
  {
    id: 'bria',
    name: 'BRIA RMBG-1.4',
    description: 'Open-source MIT-licensed model. Excellent on complex scenes, hair, and transparent objects. Set HF_TOKEN in backend to upgrade to gated RMBG-2.0.',
    badge: 'Recommended',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    id: 'rembg',
    name: 'rembg · U²-Net',
    description: 'Fast open-source model. Ideal for portraits, products, and simple foregrounds.',
    badge: 'Fast',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    ),
  },
]

export default function ModelSelector({ model, onChange, disabled }) {
  return (
    <div className={styles.wrapper}>
      <label className={styles.sectionLabel}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
          <path d="M12 8v8M8 12h8"/>
        </svg>
        AI Model
      </label>

      <div className={styles.cards}>
        {MODELS.map((m) => (
          <button
            key={m.id}
            className={[styles.card, model === m.id ? styles.selected : ''].join(' ')}
            onClick={() => onChange(m.id)}
            disabled={disabled}
            type="button"
          >
            <div className={styles.cardTop}>
              <span className={[styles.iconWrap, model === m.id ? styles.iconActive : ''].join(' ')}>
                {m.icon}
              </span>
              <div className={styles.cardInfo}>
                <span className={styles.modelName}>{m.name}</span>
                <span className={[styles.badge, styles[`badge_${m.id}`]].join(' ')}>{m.badge}</span>
              </div>
              <div className={styles.radio}>
                <div className={styles.radioDot} />
              </div>
            </div>
            <p className={styles.modelDesc}>{m.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
