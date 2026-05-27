import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://background-remover-m2tq.onrender.com';
axios.defaults.withCredentials = false;

export default axios;
