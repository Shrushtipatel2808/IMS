const BASE = '/api';

export const getToken = () => localStorage.getItem('ims_token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

export const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });

  if (res.status === 401) {
    localStorage.removeItem('ims_token');
    window.dispatchEvent(new Event('ims:logout'));
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const apiGet = (path) => apiFetch(path);
export const apiPost = (path, body) =>
  apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPut = (path, body) =>
  apiFetch(path, { method: 'PUT', body: JSON.stringify(body) });
export const apiDelete = (path) => apiFetch(path, { method: 'DELETE' });
