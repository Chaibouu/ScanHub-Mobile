import Constants from 'expo-constants';

const BACKEND_DEV_PORT = 3000;

/**
 * Adresse du backend ScanHub.
 *
 * 1. `EXPO_PUBLIC_API_URL` si elle est définie (production, ou serveur précis).
 * 2. Sinon, en développement : l'ordinateur qui fait tourner Expo fait aussi tourner le
 *    backend. On reprend donc son adresse, fournie par Expo — elle suit automatiquement
 *    les changements de réseau Wi-Fi, sans rien modifier à la main.
 * 3. Sinon `localhost` (ne fonctionne que sur un émulateur ou dans un navigateur).
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  // Ex : "192.168.1.126:8081"
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (__DEV__ && devHost) return `http://${devHost}:${BACKEND_DEV_PORT}/api/v1`;

  return `http://localhost:${BACKEND_DEV_PORT}/api/v1`;
}

export const API_CONFIG = {
  BASE_URL: resolveBaseUrl(),
  // Une base de données en ligne peut mettre plusieurs secondes à se réveiller
  TIMEOUT_MS: 15000,
  /**
   * Délai d'un scan en ligne. Au-delà, le terminal bascule sur la liste téléchargée :
   * l'agent ne doit jamais attendre longtemps devant une file d'entrée.
   */
  SCAN_TIMEOUT_MS: 5000,
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'scanhub_access_token',
  REFRESH_TOKEN: 'scanhub_refresh_token',
  USER_DATA: 'scanhub_user_data',
  DEVICE_KEY: 'scanhub_device_key',
  DEVICE_DATA: 'scanhub_device_data',
  ACTIVE_EVENT: 'scanhub_active_event',
};

