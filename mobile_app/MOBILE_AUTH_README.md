# Mobile App: Internet Identity & Face ID

## How It Works

1. **App** → Opens the main web app with `?mobile=1` in Safari
2. **Web app** → Same II flow as desktop; user taps Login, completes II in popup
3. **On success** → Custom storage (when mobile=1) captures delegation, redirects to `opend://auth#<base64data>`
4. **App** → Deep link handler stores credentials in AsyncStorage, refreshes auth state

Face ID works because the II flow runs in Safari. Uses the same working auth flow as the web app.

## Config

`src/config/canisters.ts`:
- iOS Simulator: `http://localhost:8000`
- Android Emulator: `http://10.0.2.2:8000`
- Physical device: change `HOST` to your Mac's IP (e.g. `http://192.168.1.100:8000`)

## Setup (required for mobile II)

The mobile browser cannot reach localhost. Use the **local proxy**:

1. Run `npm run mobile-proxy` (from project root, with dfx already running)
2. Set `DEV_HOST_OVERRIDE` in `src/config/canisters.ts` to the URL the proxy prints (e.g. `http://192.168.1.100:8081`)
3. Rebuild the app
4. Phone and Mac must be on the same Wi‑Fi

See **MOBILE_II_SETUP.md** for full instructions.
