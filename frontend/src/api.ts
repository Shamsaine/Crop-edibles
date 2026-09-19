import { useEffect, useRef, useState } from 'react';
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch('/api' + path, {
    ...options, credentials: 'include',
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  const text = await response.text();
  let data: unknown;
  try { data = text ? JSON.parse(text) : {}; } catch { throw new ApiError('The server returned an invalid response. Please try again.', response.status); }
  if (!response.ok) {
    const error = data as { error?: string; details?: { path?: string; message?: string }[] };
    const details = Array.isArray(error.details) ? error.details.map(item => [item.path, item.message].filter(Boolean).join(': ')).join('; ') : '';
    throw new ApiError([error.error || 'Request failed. Please try again.', details].filter(Boolean).join(' '), response.status);
  }
  return data as T;
}
export function mutate<T>(path: string, method: string, body?: unknown): Promise<T> {
  return api<T>(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
export function useResource<T>(path: string | null, revision = 0) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(path));
  useEffect(() => {
    const controller = new AbortController();
    setError(''); setData(null); setLoading(Boolean(path));
    if (path) {
      api<T>(path, { signal: controller.signal }).then(result => { if (!controller.signal.aborted) setData(result); }).catch((error: Error) => {
        if (!controller.signal.aborted) setError(error.message || 'Unable to connect to the server.');
      }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }
    return () => controller.abort();
  }, [path, revision]);
  return { data, error, loading };
}
export function useAction(onSuccess?: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const running = useRef(false);
  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(''), 4000);
    return () => window.clearTimeout(timer);
  }, [success]);
  useEffect(() => { const clear = () => { setSuccess(''); setError(''); }; window.addEventListener('hashchange', clear); return () => window.removeEventListener('hashchange', clear); }, []);
  const run = async (work: () => Promise<unknown>, message = 'Saved.') => {
    if (running.current) return false;
    running.current = true;
    setBusy(true); setError(''); setSuccess('');
    try { await work(); setSuccess(message); onSuccess?.(); return true; }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to complete this request.'); return false; }
    finally { running.current = false; setBusy(false); }
  };
  return { busy, error, success, run, setError };
}
export const money = (minor: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(minor / 100);
export const date = (value: string) => new Date(value).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
