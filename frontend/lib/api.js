const RAILWAY_URL = "https://web-backend-uas-production.up.railway.app";

const API_URL =
  typeof window !== "undefined" && !window.location.hostname.includes("localhost")
    ? process.env.NEXT_PUBLIC_API_URL || `${RAILWAY_URL}/api/backend`
    : "http://localhost:3000/api/backend";

export default API_URL;
