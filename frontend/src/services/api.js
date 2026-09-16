const BASE =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000';
const token = () =>
  localStorage.getItem('sf_token');

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const t = token();

  if (t) {
    headers.Authorization = `Bearer ${t}`;
  }

  let response;

  try {
    response = await fetch(
      `${BASE}${path}`,
      {
        ...options,
        headers
      }
    );
  } catch (error) {
    console.error('NETWORK ERROR:', error);

    throw new Error(
      `Cannot connect to SmartFarm backend at ${BASE}`
    );
  }

  const raw = await response.text();

  let data = null;

  if (raw.trim()) {
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(
        `Server returned invalid response (${response.status})`
      );
    }
  }

  if (!response.ok) {
    let message =
      `Request failed (${response.status})`;

    if (typeof data?.detail === 'string') {
      message = data.detail;
    } else if (typeof data?.message === 'string') {
      message = data.message;
    }

    throw new Error(message);
  }

  return data;
}

export const api = {
  health: () =>
    request('/health'),

  register: (body) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  login: (body) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  me: () =>
    request('/api/auth/me'),

  farm: async () => {
    const data =
      await request('/api/farms/mine');

    return (
      data?.farms?.[0] ||
      data?.farm ||
      (data?.id ? data : null)
    );
  },

  createFarm: (body) =>
    request('/api/farms', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  updateFarm: (id, body) =>
    request(`/api/farms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  events: (farmId) =>
    request(`/api/farms/${farmId}/events`),

  weather: (lat, lon) =>
    request(
      `/api/weather?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`
    ),

  recommendation: (body) =>
    request('/api/ai/recommendation', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  irrigation: (body) =>
    request('/api/irrigation/recommendation', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  chat: (body) =>
    request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  market: (crop) =>
    request(
      `/api/market/prices?crop=${encodeURIComponent(crop || '')}`
    ),

  schemes: () =>
    request('/api/schemes'),

  procurement: (lat, lon) =>
    request(
      `/api/procurement/nearby?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`
    ),

  saveDisease: (body) =>
    request('/api/data/disease', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  saveRecommendation: (body) =>
    request('/api/data/recommendation', {
      method: 'POST',
      body: JSON.stringify(body)
    })
};