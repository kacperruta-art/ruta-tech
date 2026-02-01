'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

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

function DocumentIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  )
}

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

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      setPin(stored)
      setIsAuthenticated(true)
    }
    setHasCheckedStorage(true)
  }, [storageKey])

  const sendMessage = useCallback(
    async (message: string, imageFile: File | null = null) => {
      if (!message.trim() && !imageFile) return
      const currentPin = pin

      setIsLoading(true)
      setError(null)

      let imageBase64: string | undefined
      if (imageFile) {
        try {
          imageBase64 = await fileToBase64(imageFile)
        } catch {
          setError('Failed to process image')
          setIsLoading(false)
          return
        }
      }

      const payload = {
        message: message.trim() || '(Image only)',
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
          setError('Invalid PIN')
          setIsLoading(false)
          return
        }

        if (!res.ok) {
          setError(data?.error ?? 'Request failed')
          setIsLoading(false)
          return
        }

        if (!isAuthenticated) {
          setIsAuthenticated(true)
          localStorage.setItem(storageKey, currentPin)
        }

        const userContent = [message.trim(), imageFile && '[Image attached]']
          .filter(Boolean)
          .join(' ') || '[Image only]'

        setMessages((prev) => [
          ...prev,
          { role: 'user' as const, content: userContent },
          { role: 'assistant' as const, content: data.text },
        ])
        setImage(null)
        setInputValue('')
      } catch {
        setError('Network error')
      } finally {
        setIsLoading(false)
      }
    },
    [assetId, isAuthenticated, pin, storageKey]
  )

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin.trim()) return
    sendMessage('Hi')
  }

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputValue.trim()
    if ((!text && !image) || isLoading) return
    sendMessage(text || '(Image only)', image)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setImage(file)
    }
    e.target.value = ''
  }

  const handleDocumentsClick = () => {
    alert('Manuals available')
  }

  if (!hasCheckedStorage) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-100 dark:bg-neutral-950">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 dark:border-neutral-700"
          style={{ borderTopColor: 'var(--accent)' }}
        />
      </div>
    )
  }

  if (!assetId) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-100 font-sans text-gray-600 dark:bg-neutral-950 dark:text-gray-400">
        Invalid asset
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-100 px-6 dark:bg-neutral-950">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl font-sans text-gray-800 dark:bg-neutral-900 dark:text-gray-100">
          <div className="space-y-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Technician Access
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter the property PIN for this asset
            </p>
          </div>
          <form onSubmit={handlePinSubmit} className="mt-6 space-y-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value)
                setError(null)
              }}
              placeholder="Enter Property PIN"
              autoComplete="off"
              autoFocus
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 outline-none transition focus:ring-2 focus:ring-[var(--accent)] dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
            />
            {error && (
              <p className="text-center text-sm text-red-500 dark:text-red-400">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={!pin.trim() || isLoading}
              className="w-full rounded-2xl py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {isLoading ? 'Verifying…' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const breadcrumbs = buildBreadcrumbs(asset?.location)
  const assetName = asset?.name || 'Maintenance Assistant'

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-100 px-4 py-6 dark:bg-neutral-950">
      {/* Centered card – overrides global terminal theme locally */}
      <div className="flex h-[85dvh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl text-gray-800 dark:bg-neutral-900 dark:text-gray-100 font-sans">
        <header className="shrink-0 border-b border-gray-200 px-4 py-3 dark:border-neutral-700">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {assetName}
              </h1>
              {breadcrumbs ? (
                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                  {breadcrumbs}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  Location unknown
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleDocumentsClick}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200 hover:text-gray-800 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700"
              aria-label="Documents / Manuals"
            >
              <DocumentIcon />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] rounded-2xl bg-gray-100 px-4 py-2.5 dark:bg-gray-800">
                    <p className="whitespace-pre-wrap text-sm font-sans text-gray-900 dark:text-gray-100">
                      {msg.content}
                    </p>
                  </div>
                ) : (
                  <div className="flex max-w-[85%] items-start gap-2">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: 'var(--accent)' }}
                      aria-hidden
                    />
                    <div className="rounded-2xl bg-gray-50/80 px-4 py-2.5 dark:bg-neutral-800/80">
                      <p className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-gray-800 dark:text-gray-200">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-gray-50/80 px-4 py-2.5 dark:bg-neutral-800/80">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full animate-pulse"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                  <span
                    className="h-2 w-2 rounded-full animate-pulse [animation-delay:150ms]"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                  <span
                    className="h-2 w-2 rounded-full animate-pulse [animation-delay:300ms]"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {error && (
          <div className="shrink-0 px-4 py-2 text-center text-sm text-red-500 dark:text-red-400">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSendSubmit}
          className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700"
              aria-label="Attach image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </button>

            <div className="flex min-h-10 flex-1 flex-wrap items-end gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 outline-none transition focus-within:ring-2 focus-within:ring-[var(--accent)] dark:border-neutral-600 dark:bg-neutral-800">
              {image && (
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-neutral-700 dark:text-gray-300">
                  {image.name}
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="rounded-full p-0.5 hover:bg-gray-200 dark:hover:bg-neutral-600"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </span>
              )}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Message…"
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-500 outline-none dark:text-gray-100 dark:placeholder-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || (!inputValue.trim() && !image)}
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl px-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:hover:opacity-50 md:h-10 md:min-w-[100px]"
              style={{ backgroundColor: 'var(--accent)' }}
              aria-label="Send"
            >
              <span className="md:hidden" aria-hidden>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M22 2 11 13" />
                  <path d="M22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </span>
              <span className="hidden md:inline">SEND</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
