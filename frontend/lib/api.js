const API_URL =
  typeof window !== "undefined" && !window.location.hostname.includes("localhost")
    ? process.env.NEXT_PUBLIC_API_URL
    : "http://localhost:3000/api/backend";

export default API_URL;
