import { useRef, useState } from 'react'
import { ArrowUpIcon, SpinnerIcon } from './icons'

export interface ChatNote {
  text: string
  tone: 'ok' | 'error'
}

interface Props {
  busy: boolean
  note: ChatNote | null
  onSubmit: (text: string) => void
}

export function ChatBar({ busy, note, onSubmit }: Props) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const text = value.trim()
    if (!text || busy) return
    onSubmit(text)
    setValue('')
    // Keep the keyboard up on iOS so a second entry needs no extra tap.
    inputRef.current?.focus()
  }

  return (
    <div className="chat">
      {note && (
        <p
          className={`chat__note${note.tone === 'error' ? ' chat__note--error' : ''}`}
          role="status"
          aria-live="polite"
        >
          <span className="chat__note-dot" aria-hidden="true" />
          {note.text}
        </p>
      )}

      <form className="chat__form" onSubmit={send}>
        <label className="sr-only" htmlFor="chat-input">
          Anotar un gasto o ingreso
        </label>
        <input
          id="chat-input"
          ref={inputRef}
          className="chat__input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="café 1.200, nafta 15 mil…"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="sentences"
          spellCheck={false}
          enterKeyHint="send"
          disabled={busy}
        />
        <button
          type="submit"
          className="chat__send"
          disabled={busy || value.trim().length === 0}
          aria-label={busy ? 'Anotando' : 'Anotar'}
        >
          {busy ? <SpinnerIcon /> : <ArrowUpIcon />}
        </button>
      </form>
    </div>
  )
}
