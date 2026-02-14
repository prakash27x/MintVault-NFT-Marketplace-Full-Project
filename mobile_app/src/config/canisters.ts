import { Platform } from 'react-native';

// Local canister IDs (from .dfx/local/canister_ids.json)
export const CANISTER_IDS = {
    opend: 'umunu-kh777-77774-qaaca-cai',
    token: 'uzt4z-lp777-77774-qaabq-cai',
    opend_assets: 'ulvla-h7777-77774-qaacq-cai',
    internet_identity: 'uxrrr-q7777-77774-qaaaq-cai',
};

// Host for local replica.
// - Simulator: default (127.0.0.1 / 10.0.2.2) may work, but "connection closed" is common.
// - Reliable fix: use ngrok. Run `ngrok http 8000`, set DEV_HOST_OVERRIDE to the HTTPS URL.
//   See MOBILE_II_SETUP.md for step-by-step instructions.
// Simulator: leave null (uses 127.0.0.1). Physical device: set to proxy URL from npm run mobile-proxy
export const DEV_HOST_OVERRIDE: string | null = null;

function ensureHttp(url: string | null): string {
  if (!url || !url.trim()) return '';
  const s = url.trim().replace(/\/$/, '');
  return s.startsWith('http://') || s.startsWith('https://') ? s : 'http://' + s;
}

const rawHost = DEV_HOST_OVERRIDE ?? (
    Platform.OS === 'android'
        ? 'http://10.0.2.2:8000'
        : 'http://127.0.0.1:8000'
);
const HOST = ensureHttp(rawHost);

export const IC_HOST = HOST;

// Open main app for login (same flow that works in browser). With mobile=1, on success it redirects to opend://auth
export const IDENTITY_PROVIDER =
    `${HOST}/?canisterId=${CANISTER_IDS.opend_assets}&mobile=1`;

// Quiz API - for originality check, mint metadata, quiz points
// Use machine IP for physical device (e.g. http://192.168.1.x:3000)
export const QUIZ_API_URL = Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://127.0.0.1:3000';
