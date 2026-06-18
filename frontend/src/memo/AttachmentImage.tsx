import { useEffect, useState } from 'react'
import { getAccessToken } from '../lib/api'

const cache = new Map<string, string>()

export function useBlobUrl(src: string | null): { url: string | null; error: boolean } {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setError(false)
    setUrl(null)
    if (!src) return

    const cached = cache.get(src)
    if (cached) {
      setUrl(cached)
      return
    }

    const token = getAccessToken()
    fetch(src, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        if (cancelled) return
        const objectUrl = URL.createObjectURL(blob)
        cache.set(src, objectUrl)
        setUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    return () => {
      cancelled = true
    }
  }, [src])

  return { url, error }
}

export function AttachmentImage({
  src,
  alt,
  style,
}: {
  src: string | null
  alt?: string
  style?: React.CSSProperties
}) {
  const { url, error } = useBlobUrl(src)
  if (error) {
    return <span className="text-xs text-[var(--color-danger)]">Image indisponible</span>
  }
  if (!url) {
    return <span className="text-xs opacity-40">Chargement…</span>
  }
  return <img src={url} alt={alt ?? ''} loading="lazy" decoding="async" style={style} />
}
