let accessToken: string | null = null

const TOKEN_STORAGE_KEY = 'lumina.accessToken'

export function setAccessToken(token: string | null) {
  accessToken = token
  if (token) sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
  else sessionStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken
  const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY)
  if (stored) accessToken = stored
  return accessToken
}

export class ApiError extends Error {
  constructor(public status: number, public payload: unknown, message?: string) {
    super(message ?? `Request failed: ${status}`)
  }
}

type ApiInit = Omit<RequestInit, 'body'> & {
  body?: unknown
  json?: unknown
}

export async function api<T = unknown>(path: string, init: ApiInit = {}): Promise<T> {
  const { json, body, headers, ...rest } = init
  const finalHeaders = new Headers(headers ?? {})
  let finalBody: BodyInit | undefined

  if (json !== undefined) {
    finalHeaders.set('Content-Type', 'application/json')
    finalBody = JSON.stringify(json)
  } else if (body instanceof FormData) {
    finalBody = body
  } else if (body !== undefined) {
    finalBody = body as BodyInit
  }

  const token = getAccessToken()
  if (token && !finalHeaders.has('Authorization')) {
    finalHeaders.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(path.startsWith('/') ? path : `/${path}`, {
    ...rest,
    headers: finalHeaders,
    body: finalBody,
  })

  const contentType = res.headers.get('Content-Type') ?? ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await res.json().catch(() => null) : await res.text()

  if (!res.ok) {
    if (res.status === 401) {
      setAccessToken(null)
    }
    throw new ApiError(res.status, payload)
  }

  return payload as T
}
