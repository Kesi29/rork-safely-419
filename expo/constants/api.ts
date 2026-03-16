const API_BASE = 'https://safely-backend.vercel.app/api';

async function safeFetch(url: string, body: object): Promise<any> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    console.log('API response from', url, data);
    return data;
  } catch (error) {
    console.log('API error for', url, error);
    return { success: false, error: String(error) };
  }
}

export const api = {
  inviteGuardian: (body: object) =>
    safeFetch(`${API_BASE}/guardians/invite`, body),
  startSession: (body: object) =>
    safeFetch(`${API_BASE}/sessions/start`, body),
  updateLocation: (body: object) =>
    safeFetch(`${API_BASE}/sessions/location`, body),
  arrive: (body: object) =>
    safeFetch(`${API_BASE}/sessions/arrive`, body),
  late: (body: object) =>
    safeFetch(`${API_BASE}/sessions/late`, body),
  sos: (body: object) =>
    safeFetch(`${API_BASE}/sessions/sos`, body),
};
