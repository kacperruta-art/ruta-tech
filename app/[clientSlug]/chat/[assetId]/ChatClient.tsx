'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// --- TYPES & HELPERS (Logic in English) ---
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

// --- ICONS (Minimalist SVG) ---
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
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

  // --- LOGIC (No changes to functionality) ---
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
        setError('Bildverarbeitung fehlgeschlagen') // DE Error
        setIsLoading(false)
        return
      }
    }

    const payload = {
      message: message.trim() || '(Bild gesendet)', // DE fallback
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
        setError('Ungültiger PIN Code') // DE Error
        setIsLoading(false)
        return
      }
      if (!res.ok) {
        setError(data?.error ?? 'Anfrage fehlgeschlagen') // DE Error
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
      setError('Netzwerkfehler. Bitte erneut versuchen.') // DE Error
    } finally {
      setIsLoading(false)
    }
  }, [assetId, isAuthenticated, pin, storageKey])

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin.trim()) return
    sendMessage('Hallo') // Initial handshake message
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

  // --- RENDER UI (Gemini Style + DE Translations) ---

  // 1. Loading State
  if (!hasCheckedStorage) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white dark:bg-[#0f0f0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200" style={{ borderTopColor: 'var(--accent)' }} />
      </div>
    )
  }

  // 2. Invalid Asset State
  if (!assetId) return <div className="flex min-h-[100dvh] items-center justify-center bg-white text-gray-500 font-sans">Objekt nicht gefunden (Invalid Asset)</div>

  // 3. Login Screen (PIN) - Modern & Clean
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50 px-4 font-sans dark:bg-[#050505]">
        <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white p-8 shadow-2xl dark:bg-[#111] dark:shadow-none dark:border dark:border-white/10">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Zugriffsberechtigung</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Bitte geben Sie den Objekt-PIN ein, um den Techniker-Assistenten zu starten.</p>
          </div>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(null) }}
              placeholder="Objekt-PIN"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center text-lg tracking-widest text-gray-900 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
              autoFocus
            />
            {error && <p className="text-center text-xs text-red-500">{error}</p>}
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
    )
  }

  // 4. MAIN CHAT UI (Gemini Style)
  const breadcrumbs = buildBreadcrumbs(asset?.location)
  const assetName = asset?.name || 'Assistent'

  return (
    // font-sans forces modern look, overriding global monospace
    <div className="flex h-[100dvh] w-full flex-col bg-white font-sans text-gray-900 dark:bg-[#0f0f0f] dark:text-gray-100">
      
      {/* HEADER: Minimalist, sticky */}
      <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-gray-100 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-white/5 dark:bg-[#0f0f0f]/80">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-gray-900 dark:text-white">{assetName}</h1>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{breadcrumbs || 'Standort unbekannt'}</p>
        </div>
        <button onClick={() => alert('Dokumente werden geladen...')} className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white">
          <IconDoc />
        </button>
      </header>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {/* Welcome Message / Empty State */}
          {messages.length === 0 && (
            <div className="mt-10 text-center opacity-40">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/5">
                <IconBot />
              </div>
              <p className="text-sm">Wie kann ich Ihnen bei diesem Objekt helfen?</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            return (
              <div key={i} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                {/* AI Avatar */}
                {!isUser && (
                  <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[var(--accent)] dark:bg-white/10">
                    <IconBot />
                  </div>
                )}
                
                {/* Message Bubble */}
                <div
                  className={`relative max-w-[85%] rounded-2xl px-5 py-3 text-[15px] leading-relaxed md:max-w-[75%] 
                    ${isUser 
                      ? 'rounded-tr-sm text-gray-900 dark:text-white' // User Text
                      : 'rounded-tl-sm bg-transparent px-0 py-0 text-gray-800 dark:text-gray-200' // AI Text (Clean)
                    }`}
                  // User Bubble: Dynamic Accent color with 10% opacity
                  style={isUser ? { backgroundColor: 'var(--accent)', opacity: 0.9 } : {}} 
                >
                  {/* For User bubbles, we need to handle the opacity trick cleanly without affecting text opacity if possible, 
                      or just use a solid light color. 
                      Let's use a RGBA approach if variables allow, or a simple trick: */}
                  {isUser && (
                     <div 
                        className="absolute inset-0 rounded-2xl rounded-tr-sm opacity-10" 
                        style={{ backgroundColor: 'var(--accent)' }} 
                     />
                  )}
                  {/* Correcting structure: The text needs to be ABOVE the background layer if we use the layer trick. 
                      Actually, simpler approach for "SaaS look": just use a class and override bg.
                  */}
                  
                  {/* Re-doing bubble style logic for stability */}
                   <div 
                      className={`relative z-10 whitespace-pre-wrap ${isUser ? 'px-4 py-2 bg-[var(--accent)] bg-opacity-10 rounded-2xl rounded-tr-sm' : ''}`}
                   >
                     {msg.content}
                   </div>

                </div>
              </div>
            )
          })}
          
          {isLoading && (
             <div className="flex w-full justify-start">
               <div className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10">
                 <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[var(--accent)]" />
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ERROR TOAST */}
      {error && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-red-500/90 px-4 py-2 text-sm text-white shadow-lg backdrop-blur">
          {error}
        </div>
      )}

      {/* INPUT AREA: Floating Capsule Style */}
      <div className="shrink-0 bg-white/80 px-4 pb-6 pt-2 backdrop-blur-md dark:bg-[#0f0f0f]/80">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={handleSendSubmit}
            className="relative flex items-end gap-2 rounded-[26px] bg-gray-100 p-2 shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-[var(--accent)]/50 dark:bg-[#1a1a1a]"
          >
            {/* Image Upload Button */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <IconAttach />
            </button>

            {/* Image Preview */}
            {image && (
              <div className="absolute bottom-full left-4 mb-2 flex items-center gap-2 rounded-xl bg-white p-2 shadow-lg dark:bg-[#222]">
                <span className="text-xs font-medium">{image.name}</span>
                <button type="button" onClick={() => setImage(null)} className="ml-2 text-red-500">×</button>
              </div>
            )}

            {/* Text Input */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nachricht schreiben..."
              className="max-h-32 min-h-[44px] flex-1 bg-transparent py-3 text-[15px] text-gray-900 placeholder-gray-500 outline-none dark:text-white dark:placeholder-gray-500"
              autoComplete="off"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || (!inputValue.trim() && !image)}
              className="flex h-10 items-center justify-center rounded-full px-4 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[40px]"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <span className="md:hidden"><IconSend /></span>
              <span className="hidden text-sm md:block">SENDEN</span>
            </button>
          </form>
          <div className="mt-2 text-center text-[10px] text-gray-400 dark:text-gray-600">
            KI kann Fehler machen. Bitte wichtige Informationen überprüfen.
          </div>
        </div>
      </div>
    </div>
  )
}