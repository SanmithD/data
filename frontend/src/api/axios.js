import axios from "axios";

const api = axios.create({
  baseURL: "https://myapp-k8z6.onrender.com/api",
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true
});

export default api;