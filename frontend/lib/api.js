const API_URL =
  typeof window !== "undefined" && !window.location.hostname.includes("localhost")
    ? "/api/backend"
    : "http://localhost:3000/api/backend";

export default API_URL;
