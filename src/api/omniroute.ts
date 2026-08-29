export type Route = {
  id?: number;
  from: string;
  to: string;
  eta_min?: number;
  metadata?: Record<string, any>;
};

async function callProxy(path: string, options: RequestInit = {}) {
  const res = await fetch(`/api/omniroute${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OmniRoute proxy error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function listRoutes() {
  return callProxy('/', { method: 'GET' });
}

export async function getRoute(id: number) {
  return callProxy(`/?id=${id}`, { method: 'GET' });
}

export async function createRoute(payload: Route) {
  return callProxy('/', { method: 'POST', body: JSON.stringify(payload) });
}
