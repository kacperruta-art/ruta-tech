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

// --- ICONS (Sleek, minimal) ---
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
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

  // --- STYLES: Override globals. Enterprise chat UI. ---
  const chatStyles = {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }
  const light = {
    bg: '#ffffff',
    text: '#0f172a',
    border: '#e2e8f0',
    bubbleUserBg: 'color-mix(in srgb, var(--accent) 10%, transparent)',
    bubbleAiBg: '#f8fafc',
    inputBg: '#ffffff',
    muted: '#64748b',
  }
  const dark = {
    bg: '#09090b',
    text: '#e2e8f0',
    border: 'rgba(226, 232, 240, 0.12)',
    bubbleUserBg: 'color-mix(in srgb, var(--accent) 10%, transparent)',
    bubbleAiBg: 'rgba(255,255,255,0.04)',
    inputBg: 'rgba(255,255,255,0.06)',
    muted: '#94a3b8',
  }

  const chatRootCss = `
    [data-chat-root],
    [data-chat-root] * {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
    }
    [data-chat-root] {
      --chat-bg: ${light.bg};
      --chat-text: ${light.text};
      --chat-border: ${light.border};
      --chat-muted: ${light.muted};
      --chat-bubble-user-bg: ${light.bubbleUserBg};
      --chat-bubble-ai-bg: ${light.bubbleAiBg};
      --chat-input-bg: ${light.inputBg};
      --chat-bg-overlay: rgba(255, 255, 255, 0.85);
      --chat-card-bg: #f8fafc;
    }
    [data-theme="dark"] [data-chat-root],
    .dark [data-chat-root] {
      --chat-bg: ${dark.bg};
      --chat-text: ${dark.text};
      --chat-border: ${dark.border};
      --chat-muted: ${dark.muted};
      --chat-bubble-user-bg: ${dark.bubbleUserBg};
      --chat-bubble-ai-bg: ${dark.bubbleAiBg};
      --chat-input-bg: ${dark.inputBg};
      --chat-bg-overlay: rgba(9, 9, 11, 0.85);
      --chat-card-bg: #18181b;
    }
  `

  // Single root so CSS variables apply to all states (loading, invalid, PIN, chat)
  const content =
    !hasCheckedStorage ? (
      <div className="flex flex-1 items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-transparent"
          style={{ borderTopColor: 'var(--accent)', borderRightColor: 'var(--chat-border)' }}
        />
      </div>
    ) : !assetId ? (
      <div className="flex flex-1 items-center justify-center" style={{ color: 'var(--chat-text)' }}>
        Objekt nicht gefunden
      </div>
    ) : !isAuthenticated ? (
      <div className="flex flex-1 items-center justify-center px-4" style={{ color: 'var(--chat-text)' }}>
        <div
          className="w-full max-w-sm overflow-hidden rounded-2xl p-8 shadow-lg"
          style={{
            backgroundColor: 'var(--chat-card-bg)',
            border: '1px solid var(--chat-border)',
          }}
        >
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--chat-text)' }}>
              Zugriffsberechtigung
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--chat-muted)' }}>
              Bitte geben Sie den Objekt-PIN ein, um den Assistenten zu starten.
            </p>
          </div>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(null) }}
              placeholder="Objekt-PIN"
              className="w-full rounded-xl border px-4 py-3 text-center text-lg tracking-widest outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{
                borderColor: 'var(--chat-border)',
                backgroundColor: 'var(--chat-input-bg)',
                color: 'var(--chat-text)',
              }}
              autoFocus
            />
            {error && <p className="text-center text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={!pin.trim() || isLoading}
              className="w-full rounded-xl py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
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
      <div
        data-chat-root
        className="flex min-h-[100dvh] w-full flex-col"
        style={{ ...chatStyles, backgroundColor: 'var(--chat-bg)', color: 'var(--chat-text)' }}
      >
        <style dangerouslySetInnerHTML={{ __html: chatRootCss }} />
        {content}
      </div>
    )
  }

  return (
    <div
      data-chat-root
      className="flex h-[100dvh] w-full flex-col"
      style={{ ...chatStyles, backgroundColor: 'var(--chat-bg)', color: 'var(--chat-text)' }}
    >
      <style dangerouslySetInnerHTML={{ __html: chatRootCss }} />
      {/* Sticky Header (blur) */}
      <header
        className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b px-4 py-3 backdrop-blur-md"
        style={{
          borderColor: 'var(--chat-border)',
          backgroundColor: 'var(--chat-bg-overlay)',
        }}
      >
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold" style={{ color: 'var(--chat-text)' }}>
            {assetName}
          </h1>
          <p className="truncate text-xs" style={{ color: 'var(--chat-muted)' }}>
            {breadcrumbs || 'Standort unbekannt'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => alert('Dokumente werden geladen...')}
          className="rounded-full p-2 transition hover:opacity-80"
          style={{ color: 'var(--chat-muted)' }}
          aria-label="Dokumente"
        >
          <IconDoc />
        </button>
      </header>

      {/* Scrollable messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {messages.length === 0 && (
            <div className="mt-10 flex flex-col items-center text-center opacity-60">
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--chat-bubble-ai-bg)', color: 'var(--chat-muted)' }}
              >
                <IconBot />
              </div>
              <p className="text-sm" style={{ color: 'var(--chat-muted)' }}>
                Wie kann ich Ihnen bei diesem Objekt helfen?
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            return (
              <div key={i} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div
                    className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: 'var(--chat-bubble-ai-bg)', color: 'var(--chat-muted)' }}
                  >
                    <IconBot />
                  </div>
                )}
                <div
                  className={`relative max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed md:max-w-[75%] ${
                    isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
                  }`}
                  style={
                    isUser
                      ? {
                          backgroundColor: 'var(--chat-bubble-user-bg)',
                          color: 'var(--chat-text)',
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: 'var(--chat-text)',
                        }
                  }
                >
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                </div>
              </div>
            )
          })}

          {isLoading && (
            <div className="flex w-full justify-start">
              <div
                className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--chat-bubble-ai-bg)' }}
              >
                <div
                  className="h-4 w-4 animate-spin rounded-full border-2 border-transparent"
                  style={{ borderTopColor: 'var(--accent)' }}
                />
              </div>
              <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ backgroundColor: 'var(--chat-bubble-ai-bg)' }}>
                <span className="text-sm" style={{ color: 'var(--chat-muted)' }}>
                  Denkt nach...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div
          className="absolute bottom-28 left-1/2 z-20 -translate-x-1/2 rounded-xl px-4 py-2 text-sm text-white shadow-lg backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.95)' }}
        >
          {error}
        </div>
      )}

      {/* Sticky input bar — Message bar style */}
      <div
        className="sticky bottom-0 z-10 shrink-0 border-t px-4 py-4 backdrop-blur-md"
        style={{
          borderColor: 'var(--chat-border)',
          backgroundColor: 'var(--chat-bg-overlay)',
        }}
      >
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={handleSendSubmit}
            className="flex items-end gap-2 rounded-xl border px-3 py-2 shadow-sm transition-shadow focus-within:ring-2"
            style={{
              borderColor: 'var(--chat-border)',
              backgroundColor: 'var(--chat-input-bg)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition hover:opacity-80"
              style={{ color: 'var(--chat-muted)' }}
              aria-label="Bild anhängen"
            >
              <IconAttach />
            </button>

            {image && (
              <div
                className="absolute bottom-full left-4 mb-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--chat-input-bg)',
                  borderColor: 'var(--chat-border)',
                  color: 'var(--chat-text)',
                }}
              >
                <span className="max-w-[120px] truncate font-medium">{image.name}</span>
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="ml-1 text-red-500 hover:underline"
                  aria-label="Bild entfernen"
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
              className="min-h-[44px] flex-1 bg-transparent py-2.5 text-[15px] outline-none placeholder:opacity-70"
              style={{ color: 'var(--chat-text)' }}
              autoComplete="off"
            />

            <button
              type="submit"
              disabled={isLoading || (!inputValue.trim() && !image)}
              className="flex h-10 min-w-[40px] items-center justify-center gap-2 rounded-xl px-4 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[100px]"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <span className="sm:hidden" aria-hidden>
                <IconSend />
              </span>
              <span className="hidden sm:inline">Senden</span>
            </button>
          </form>
          <p className="mt-2 text-center text-xs" style={{ color: 'var(--chat-muted)' }}>
            KI kann Fehler machen. Bitte wichtige Informationen überprüfen.
          </p>
        </div>
      </div>

    </div>
  )
}
