
import axios from 'axios';
import { auth } from './firebase'; // Assuming firebase config is in firebase.ts

const api = axios.create({
  baseURL: 'http://localhost:3001/v1',
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
