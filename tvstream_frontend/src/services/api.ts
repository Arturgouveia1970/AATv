import axios from 'axios';

// Configure the base URL for the API. During development this can point to
// localhost:8000. In production you would set this via an environment variable.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchCategories() {
  const { data } = await axios.get(`${API_BASE_URL}/categories/`);
  return data;
}

export async function fetchLanguages() {
  const { data } = await axios.get(`${API_BASE_URL}/languages/`);
  return data;
}


export async function fetchChannels(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/channels/${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to load channels');
  return res.json();
}

export async function fetchChannelDetail(id) {
  const { data } = await axios.get(`${API_BASE_URL}/channels/${id}/`);
  return data;
}

console.log('API Base URL:', API_BASE_URL);
