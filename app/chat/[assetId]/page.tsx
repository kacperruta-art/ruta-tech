'use client'

import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

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

export default function ChatPage() {
  const params = useParams()
  const assetId = params.assetId as string

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

  const storageKey = `${STORAGE_KEY_PREFIX}-${assetId}`

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
          .join(' ') || '[Image]'

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

  if (!hasCheckedStorage) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-400" />
      </div>
    )
  }

  if (!assetId) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950 text-zinc-400">
        Invalid asset
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-zinc-100">
              Technician Access
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Enter the access PIN for this asset
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value)
                setError(null)
              }}
              placeholder="PIN"
              autoComplete="off"
              autoFocus
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
            {error && (
              <p className="text-center text-sm text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={!pin.trim() || isLoading}
              className="w-full rounded-lg bg-zinc-100 py-3 font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50 disabled:hover:bg-zinc-100"
            >
              {isLoading ? 'Verifying…' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/95 px-4 py-3 backdrop-blur">
        <h1 className="text-center text-base font-medium text-zinc-100">
          Maintenance Assistant
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'bg-zinc-800 text-zinc-200'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-zinc-800 px-4 py-2.5">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-zinc-500" />
                <span className="ml-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-zinc-500 [animation-delay:150ms]" />
                <span className="ml-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-zinc-500 [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 text-center text-sm text-red-400">{error}</div>
      )}

      <form
        onSubmit={handleSendSubmit}
        className="sticky bottom-0 border-t border-zinc-800 bg-zinc-950 px-4 py-3"
      >
        <div className="mx-auto flex max-w-2xl items-end gap-2">
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-300"
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

          <div className="flex min-h-10 flex-1 flex-wrap items-end gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2">
            {image && (
              <span className="flex items-center gap-1 rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                {image.name}
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="rounded-full p-0.5 hover:bg-zinc-600"
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
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || (!inputValue.trim() && !image)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50 disabled:hover:bg-zinc-100"
            aria-label="Send"
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
              <path d="M22 2 11 13" />
              <path d="M22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
