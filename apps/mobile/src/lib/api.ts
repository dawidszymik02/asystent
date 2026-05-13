import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import supabase from './supabase';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Token:', session?.access_token ? 'EXISTS - ' + session.access_token.substring(0, 20) + '...' : 'NULL');
  console.log('Request URL:', config.url);
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().signOut();
    }
    return Promise.reject(error);
  },
);

export { api };
