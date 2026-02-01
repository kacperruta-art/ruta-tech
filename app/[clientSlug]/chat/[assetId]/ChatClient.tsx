'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// --- TYPES & HELPERS ---
type Message = { role: 'user' | 'assistant'; content: string }

export type AssetHeaderInfo = {
  name?: string
  location?: {
    name?: string
    parentFloor?: {
      name?: string
      parentSection?: {
        name?: string
        parentProperty?: { name?: string }
      }
    }
  }
} | null

type LocationInfo = NonNullable<AssetHeaderInfo>['location']

const STORAGE_KEY_PREFIX = 'ruta-chat-pin'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64 ?? '')
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function buildBreadcrumbs(location: LocationInfo): string {
  if (!location) return ''
  const propertyName = location.parentFloor?.parentSection?.parentProperty?.name
  const sectionName = location.parentFloor?.parentSection?.name
  const unitName = location.name
  return [propertyName, sectionName, unitName].filter(Boolean).join(' • ')
}

// --- ICONS (Minimal Gemini-style) ---
function IconAttach() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18.1 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

function IconSend() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}

function IconBot() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  )
}

function IconDoc() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

// --- MAIN COMPONENT ---
export function ChatClient({
  clientSlug,
  assetId,
  asset,
}: {
  clientSlug: string
  assetId: string
  asset: AssetHeaderInfo
}) {
  const [pin, setPin] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const storageKey = `${STORAGE_KEY_PREFIX}-${clientSlug}-${assetId}`

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      setPin(stored)
      setIsAuthenticated(true)
    }
    setHasCheckedStorage(true)
  }, [storageKey])

  const sendMessage = useCallback(async (message: string, imageFile: File | null = null) => {
    if (!message.trim() && !imageFile) return
    const currentPin = pin
    setIsLoading(true)
    setError(null)

    let imageBase64: string | undefined
    if (imageFile) {
      try {
        imageBase64 = await fileToBase64(imageFile)
      } catch {
        setError('Bildverarbeitung fehlgeschlagen')
        setIsLoading(false)
        return
      }
    }

    const payload = {
      message: message.trim() || '(Bild gesendet)',
      pin: currentPin,
      publicId: assetId,
      ...(imageBase64 && { image: imageBase64 }),
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.status === 401) {
        localStorage.removeItem(storageKey)
        setPin('')
        setIsAuthenticated(false)
        setError('Ungültiger PIN-Code')
        setIsLoading(false)
        return
      }
      if (!res.ok) {
        setError(data?.error ?? 'Anfrage fehlgeschlagen')
        setIsLoading(false)
        return
      }
      if (!isAuthenticated) {
        setIsAuthenticated(true)
        localStorage.setItem(storageKey, currentPin)
      }

      const userContent = [message.trim(), imageFile && '[Bild angehängt]'].filter(Boolean).join(' ') || '[Bild]'

      setMessages((prev) => [
        ...prev,
        { role: 'user' as const, content: userContent },
        { role: 'assistant' as const, content: data.text },
      ])
      setImage(null)
      setInputValue('')
    } catch {
      setError('Netzwerkfehler. Bitte erneut versuchen.')
    } finally {
      setIsLoading(false)
    }
  }, [assetId, isAuthenticated, pin, storageKey])

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin.trim()) return
    sendMessage('Hallo')
  }

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputValue.trim()
    if ((!text && !image) || isLoading) return
    sendMessage(text || '(Bild)', image)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) setImage(file)
    e.target.value = ''
  }

  // --- RENDER STATES (Loading, Not Found, Login) ---
  const content =
    !hasCheckedStorage ? (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]" />
      </div>
    ) : !assetId ? (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-[var(--muted)]">Objekt nicht gefunden</p>
      </div>
    ) : !isAuthenticated ? (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-lg sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <img
              src="/favicon.ico"
              alt="Logo"
              className="mb-5 h-12 w-12 object-contain"
            />
            <h2 className="mb-2 text-2xl font-semibold text-[var(--foreground)]">
              Zugriffsberechtigung
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Bitte geben Sie den Objekt-PIN ein, um den Assistenten zu starten.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(null) }}
              placeholder="Objekt-PIN"
              autoFocus
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-center text-base tracking-[0.18em] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
            />
            {error && (
              <p className="text-center text-sm text-red-600">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={!pin.trim() || isLoading}
              className="w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Verbinde...' : 'System starten'}
            </button>
          </form>
        </div>
      </div>
    ) : null

  // Main Chat UI (when authenticated)
  const breadcrumbs = buildBreadcrumbs(asset?.location)
  const assetName = asset?.name || 'Assistent'

  if (content) {
    return (
      <div className="flex min-h-dvh w-full flex-col bg-[var(--background)] text-[var(--foreground)]">
        {content}
      </div>
    )
  }

  return (
    <div className="flex h-dvh w-full flex-col bg-[var(--background)] text-[var(--foreground)]">

      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <img
              src="/favicon.ico"
              alt="Logo"
              className="h-8 w-8 flex-shrink-0 object-contain"
            />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-[var(--foreground)]">
                {assetName}
              </h1>
              <p className="truncate text-xs text-[var(--muted)]">
                {breadcrumbs || 'Standort unbekannt'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => alert('Dokumente werden geladen...')}
            aria-label="Dokumente"
            className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-slate-100 hover:text-[var(--foreground)] dark:hover:bg-slate-900/40"
          >
            <IconDoc />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {messages.length === 0 && (
            <div className="mt-16 flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[var(--muted)] dark:bg-blue-900/20">
                <IconBot />
              </div>
              <p className="text-sm text-[var(--muted)]">
                Wie kann ich Ihnen bei diesem Objekt helfen?
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            return (
              <div
                key={i}
                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[var(--muted)] dark:bg-slate-800">
                    <IconBot />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed text-[var(--foreground)] ${
                    isUser
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'bg-slate-50 dark:bg-slate-900/40'
                  }`}
                >
                  <span className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </span>
                </div>
              </div>
            )
          })}

          {isLoading && (
            <div className="flex w-full justify-start">
              <div className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]" />
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-[var(--muted)] dark:bg-slate-900/40">
                Denkt nach...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {error && (
        <div className="fixed bottom-28 left-1/2 z-20 -translate-x-1/2 rounded-xl bg-red-600/90 px-5 py-3 text-sm text-white shadow-lg backdrop-blur">
          {error}
        </div>
      )}

      <div className="sticky bottom-0 z-10 border-t border-[var(--border)] bg-[var(--background)] backdrop-blur px-4 py-4">
        <div className="relative mx-auto max-w-3xl">
          <form
            onSubmit={handleSendSubmit}
            className="flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-lg transition focus-within:border-[var(--brand)] focus-within:ring-2 focus-within:ring-[color:var(--brand)]/20"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              aria-hidden
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Bild anhängen"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--muted)] transition hover:bg-slate-100 hover:text-[var(--foreground)] dark:hover:bg-slate-900/40"
            >
              <IconAttach />
            </button>

            {image && (
              <div className="absolute bottom-full left-3 mb-2 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-lg">
                <span className="max-w-[8rem] truncate font-medium">
                  {image.name}
                </span>
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  aria-label="Bild entfernen"
                  className="ml-1 text-lg leading-none text-red-600 hover:underline"
                >
                  ×
                </button>
              </div>
            )}

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nachricht..."
              autoComplete="off"
              className="flex-1 bg-transparent px-2 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
            />

            <button
              type="submit"
              disabled={isLoading || (!inputValue.trim() && !image)}
              className="inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-xl bg-[var(--brand)] px-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="hidden sm:inline">Senden</span>
              <span className="inline sm:hidden">
                <IconSend />
              </span>
            </button>
          </form>

          <p className="mt-3 text-center text-xs text-[var(--muted)]">
            KI kann Fehler machen. Bitte wichtige Informationen überprüfen.
          </p>
        </div>
      </div>
    </div>
  )
}