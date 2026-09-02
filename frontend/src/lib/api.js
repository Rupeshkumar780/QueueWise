const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function fetchAPI(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const err = new Error(error.message || `API request failed: ${response.statusText}`);
    err.response = { status: response.status, data: error };
    throw err;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

const api = {
  get: async (endpoint) => {
    const data = await fetchAPI(endpoint, { method: 'GET' });
    return { data };
  },
  post: async (endpoint, body) => {
    const data = await fetchAPI(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(body) 
    });
    return { data };
  }
};

export default api;
