import { logger } from "@/lib/logger";

// Square publishable credentials (safe for frontend use)
// These are public identifiers visible in browser network requests
export const SQUARE_CONFIG = {
  applicationId: import.meta.env.VITE_SQUARE_APP_ID || "",
  locationId: import.meta.env.VITE_SQUARE_LOCATION_ID || "",
} as const;

// Warn in development if Square env vars are missing
if (!import.meta.env.VITE_SQUARE_APP_ID) {
  logger.warn("Missing VITE_SQUARE_APP_ID — Square payments will not work. See .env.example");
}
if (!import.meta.env.VITE_SQUARE_LOCATION_ID) {
  logger.warn("Missing VITE_SQUARE_LOCATION_ID — Square payments will not work. See .env.example");
}
