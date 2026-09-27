// Centralized API Base configuration
// Defaults to http://localhost:8000 for local development,
// and automatically uses VITE_API_URL when configured in deployment environments (Vercel, Netlify, etc.)
export const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");
