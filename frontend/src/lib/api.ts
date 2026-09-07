import { config } from './config';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  token?: string | null;
  isFormData?: boolean;
};

async function request<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (!opts.isFormData) headers['Content-Type'] = 'application/json';
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;

  const res = await fetch(`${config.apiUrl}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? (opts.isFormData ? (opts.body as FormData) : JSON.stringify(opts.body)) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok || (data && data.success === false)) {
    throw new ApiError(
      data?.message || `Request failed with status ${res.status}`,
      data?.code || 'UNKNOWN_ERROR',
      res.status,
      data?.details
    );
  }

  return data as T;
}

export const api = {
  get: <T = unknown>(path: string, token?: string | null) => request<T>(path, { method: 'GET', token }),
  post: <T = unknown>(path: string, body?: unknown, token?: string | null) => request<T>(path, { method: 'POST', body, token }),
  put: <T = unknown>(path: string, body?: unknown, token?: string | null) => request<T>(path, { method: 'PUT', body, token }),
  del: <T = unknown>(path: string, token?: string | null) => request<T>(path, { method: 'DELETE', token }),
  upload: <T = unknown>(path: string, formData: FormData, token?: string | null) =>
    request<T>(path, { method: 'POST', body: formData, token, isFormData: true }),
};
