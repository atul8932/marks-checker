import axios from "axios";

const configuredBaseURL = (import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/$/, "");

const fallbackBaseURL = "http://localhost:5000";
const baseURL =
  configuredBaseURL &&
  !configuredBaseURL.includes("localhost:5173") &&
  !configuredBaseURL.includes("127.0.0.1:5173")
    ? configuredBaseURL
    : fallbackBaseURL;

export const api = axios.create({
  baseURL,
  timeout: 180_000,
});

