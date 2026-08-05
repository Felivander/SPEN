import { useEffect, useRef, useState } from 'react'
import { GROQ_MODELS, hasLLM } from '../lib/llm'
import { exportJSON, importJSON } from '../lib/storage'
import { useDragToClose } from '../lib/useDragToClose'
import type { Movement, Settings, Theme } from '../types'
import type { User } from '@supabase/supabase-js'
import { ChevronDownPlain, CloseIcon, GoogleIcon } from './icons'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
]

interface Props {
  settings: Settings
  movements: Movement[]
  user: User | null
  onSignInWithGoogle: () => void
  onSignOut: () => void
  onChange: (patch: Partial<Settings>) => void
  onImport: (movements: Movement[]) => void
  onClear: () => void
  onClose: () => void
}

export function SettingsSheet({
  settings,
  movements,
  user,
  onSignInWithGoogle,
  onSignOut,
  onChange,
  onImport,
  onClear,
  onClose,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const scrimRef  = useRef<HTMLDivElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  useDragToClose(sheetRef, onClose, 'down', scrimRef)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    sheetRef.current?.focus()
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const connected = hasLLM(settings)
  const viaProxy = Boolean(settings.proxyUrl.trim())

  const download = () => {
    const blob = new Blob([exportJSON(movements)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spens-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const pickFile = async (file: File) => {
    try {
      const imported = importJSON(await file.text())
      onImport(imported)
      setFeedback(`Importados ${imported.length} movimientos.`)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No se pudo leer el archivo.')
    }
  }

  const clearAll = () => {
    if (movements.length === 0) return
    const ok = window.confirm(
      `Se borran ${movements.length} movimientos de este dispositivo. Esta acción no se puede deshacer. ¿Seguir?`,
    )
    if (ok) {
      onClear()
      setFeedback('Movimientos borrados.')
    }
  }

  return (
    <>
      <div className="scrim" ref={scrimRef} onClick={onClose} aria-hidden="true" />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        tabIndex={-1}
        ref={sheetRef}
      >
        <div className="sheet__grip" aria-hidden="true" />

        <div className="sheet__head">
          <h2 className="sheet__title" id="sheet-title">
            Ajustes
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar ajustes">
            <CloseIcon />
          </button>
        </div>

        <p className="sheet__status">
          <span
            className={`sheet__status-dot${connected ? '' : ' sheet__status-dot--off'}`}
            aria-hidden="true"
          />
          {connected
            ? viaProxy
              ? 'Leyendo con IA (servidor propio)'
              : 'Leyendo con IA (Groq)'
            : 'Leyendo sin IA — modo local'}
        </p>

        {/* ----- Cuenta y Nube -------------------------------------------- */}
        <div className="field">
          <span className="field__label">Cuenta y Nube</span>
          {user ? (
            <div className="auth-card">
              <div className="auth-card__user">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="auth-card__avatar"
                  />
                ) : (
                  <div className="auth-card__avatar-placeholder">
                    {(user.email?.[0] ?? 'U').toUpperCase()}
                  </div>
                )}
                <div className="auth-card__info">
                  <span className="auth-card__name">
                    {user.user_metadata?.full_name ?? user.email ?? 'Usuario'}
                  </span>
                  <span className="auth-card__status">
                    ✓ Sincronizado en Supabase
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn--subtle btn--sm"
                onClick={onSignOut}
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div className="auth-card auth-card--logged-out">
              <p className="auth-card__hint">
                Iniciá sesión para respaldar tus gastos en la nube y acceder desde cualquier celular o PC.
              </p>
              {authError && (
                <p className="auth-card__error">{authError}</p>
              )}
              <button
                type="button"
                className="btn btn--google"
                onClick={async () => {
                  setAuthError(null)
                  try {
                    await onSignInWithGoogle()
                  } catch (err) {
                    setAuthError(err instanceof Error ? err.message : 'Error al iniciar sesión con Google')
                  }
                }}
              >
                <GoogleIcon size={18} />
                <span>Continuar con Google</span>
              </button>
            </div>
          )}
        </div>

        {/* ----- Configuración de Supabase --------------------------------- */}
        <div className="field">
          <label className="field__label" htmlFor="supabase-url">
            Supabase URL (opcional si usás .env)
          </label>
          <input
            id="supabase-url"
            type="url"
            className="input"
            placeholder="https://tu-proyecto.supabase.co"
            value={settings.supabaseUrl ?? ''}
            onChange={(e) => onChange({ supabaseUrl: e.target.value })}
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="supabase-key">
            Supabase Anon Key (opcional si usás .env)
          </label>
          <input
            id="supabase-key"
            type="password"
            className="input"
            placeholder="eyJhbGciOi..."
            value={settings.supabaseAnonKey ?? ''}
            onChange={(e) => onChange({ supabaseAnonKey: e.target.value })}
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>

        {/* ----- Apariencia ------------------------------------------------ */}

        <div className="field">
          <span className="field__label" id="theme-label">
            Apariencia
          </span>
          <div className="seg" role="radiogroup" aria-labelledby="theme-label">
            {THEMES.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={settings.theme === option.value}
                className="seg__option"
                onClick={() => onChange({ theme: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span className="field__hint">
            «Sistema» sigue lo que tenga configurado el teléfono.
          </span>
        </div>

        {/* ----- Groq (opcional) ------------------------------------------- */}

        <div className="field">
          <span className="field__label">Lectura con IA — opcional</span>
          <span className="field__hint">
            La app ya entiende montos, fechas y categorías sin nada configurado, y
            así nada de lo que escribís sale del teléfono. Poné una clave solo si
            querés que además resuelva frases más sueltas o comercios que no
            conoce. Es <strong>tu</strong> clave, en <strong>tu</strong> dispositivo.
          </span>
        </div>

        <label className="field">
          <span className="field__label">Clave de Groq</span>
          <input
            className="input"
            type="password"
            value={settings.apiKey}
            onChange={(e) => onChange({ apiKey: e.target.value })}
            placeholder="gsk_…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            disabled={viaProxy}
          />
          <span className="field__hint">
            {viaProxy ? (
              <>La clave vive en tu servidor; el navegador nunca la recibe. Este campo queda inactivo.</>
            ) : (
              <>
                <strong>Queda a la vista.</strong> Se guarda en este navegador y se manda
                desde acá, así que se puede leer desde las herramientas de desarrollador
                o si alguien te agarra el teléfono desbloqueado. Como es tuya y es gratis,
                el riesgo es tuyo y la rotás en dos clics. Sacá una en{' '}
                <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer noopener">
                  console.groq.com/keys
                </a>
                .
              </>
            )}
          </span>
        </label>

        <label className="field">
          <span className="field__label">Modelo</span>
          <span className="select-wrap">
            <select
              className="select"
              value={settings.model}
              onChange={(e) => onChange({ model: e.target.value })}
            >
              {GROQ_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDownPlain />
          </span>
        </label>

        <label className="field">
          <span className="field__label">Proxy (opcional)</span>
          <input
            className="input"
            type="url"
            value={settings.proxyUrl}
            onChange={(e) => onChange({ proxyUrl: e.target.value })}
            placeholder="https://tu-app.vercel.app/api/parse"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <span className="field__hint">
            Endpoint propio que reenvía a Groq con la clave del lado del servidor. Si lo
            completás, se usa en lugar de la clave local.
          </span>
        </label>

        {/* ----- Formato --------------------------------------------------- */}

        <label className="field">
          <span className="field__label">Símbolo</span>
          <input
            className="input"
            type="text"
            value={settings.currency}
            onChange={(e) => onChange({ currency: e.target.value.slice(0, 4) })}
            placeholder="$"
            maxLength={4}
          />
        </label>

        {/* ----- Datos ----------------------------------------------------- */}

        <div className="sheet__actions">
          <button type="button" className="btn btn--grow" onClick={download}>
            Exportar
          </button>
          <button
            type="button"
            className="btn btn--grow"
            onClick={() => fileRef.current?.click()}
          >
            Importar
          </button>
          <button type="button" className="btn btn--danger btn--grow" onClick={clearAll}>
            Borrar todo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void pickFile(file)
              e.target.value = ''
            }}
          />
        </div>

        {feedback && (
          <p className="field__hint" role="status" aria-live="polite">
            {feedback}
          </p>
        )}

        <p className="field__hint" style={{ marginBlockStart: '1rem' }}>
          Todo se guarda en este dispositivo. Exportá de vez en cuando si no querés perderlo.
        </p>
      </div>
    </>
  )
}
