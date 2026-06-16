// Access token is held in memory only — never in localStorage/sessionStorage
// or a JS-readable cookie (§5.1). It is re-hydrated on app boot via the silent
// refresh against the httpOnly refresh-token cookie (see AuthContext).
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public payload: unknown,
    message?: string,
  ) {
    super(message ?? `Request failed: ${status}`)
  }
}

type ApiInit = Omit<RequestInit, 'body'> & {
  body?: unknown
  json?: unknown
}

async function tryRefresh(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) return null
    const data = (await res.json()) as { accessToken?: string }
    if (data.accessToken) {
      setAccessToken(data.accessToken)
      return data.accessToken
    }
    return null
  } catch {
    return null
  }
}

async function rawFetch(path: string, init: ApiInit, token: string | null): Promise<Response> {
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

  if (token && !finalHeaders.has('Authorization')) {
    finalHeaders.set('Authorization', `Bearer ${token}`)
  }

  return fetch(path.startsWith('/') ? path : `/${path}`, {
    ...rest,
    headers: finalHeaders,
    body: finalBody,
    credentials: 'include',
  })
}

export async function api<T = unknown>(path: string, init: ApiInit = {}): Promise<T> {
  let res = await rawFetch(path, init, getAccessToken())

  if (res.status === 401) {
    const newToken = await tryRefresh()
    if (newToken) {
      res = await rawFetch(path, init, newToken)
    } else {
      setAccessToken(null)
    }
  }

  const contentType = res.headers.get('Content-Type') ?? ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await res.json().catch(() => null) : await res.text()

  if (!res.ok) {
    throw new ApiError(res.status, payload)
  }

  return payload as T
}
