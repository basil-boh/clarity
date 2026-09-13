/**
 * Route only.
 *
 * expo-router derives the URL from this file's path, so the routing table has
 * to live under `app/`. Everything else (the screen, its controller, its
 * model) lives in `src/` under the layer it belongs to. Keeping these files to
 * a single re-export is what stops the router's folder from quietly becoming a
 * third place where view logic accumulates.
 */
export { default } from '@/views/screens/TodayScreen';
