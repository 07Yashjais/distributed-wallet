const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return "http://localhost:5000/api";
  }
  // Production fallback: relative /api for reverse proxy or CloudFront
  return "/api";
};

const API_BASE = getApiBase();

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new Error('Unable to connect to server. Please ensure the backend is running.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = { message: response.statusText || 'Request failed' };
  }

  if (!response.ok) {
    if (response.status === 401 && !endpoint.startsWith('/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  auth: {
    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    register: (name, email, password) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),
  },

  wallet: {
    get: () => request('/wallet'),

    create: () =>
      request('/wallet', { method: 'POST' }),

    deposit: (amount, idempotencyKey) =>
      request('/wallet/deposit', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        },
        body: JSON.stringify({ amount }),
      }),

    withdraw: (amount, idempotencyKey) =>
      request('/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        },
        body: JSON.stringify({ amount }),
      }),
  },

  transfers: {
    send: (receiverWalletId, amount, idempotencyKey) =>
      request('/transfers', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        },
        body: JSON.stringify({ receiverWalletId, amount }),
      }),
  },

  transactions: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/transactions${query ? `?${query}` : ''}`);
    },
  },
};

