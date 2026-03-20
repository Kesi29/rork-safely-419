export const CONFIG = {
  GOOGLE_MAPS_KEY:
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY
    || 'PASTE_YOUR_GOOGLE_MAPS_KEY_HERE',
  GOOGLE_PLACES_KEY:
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
    || 'PASTE_YOUR_GOOGLE_PLACES_KEY_HERE',
  RESEND_KEY:
    process.env.EXPO_PUBLIC_RESEND_API_KEY
    || 'PASTE_YOUR_RESEND_KEY_HERE',
  TRACKING_URL:
    'https://safely-web-eight.vercel.app/track',
  BACKEND_URL:
    'https://safely-backend.vercel.app/api',
};
