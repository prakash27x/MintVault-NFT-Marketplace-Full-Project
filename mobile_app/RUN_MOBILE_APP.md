# Run OpenD Mobile App

## What's Been Configured

1. **Canister IDs** – Updated in `src/config/canisters.ts`:
   - opend: `umunu-kh777-77774-qaaca-cai`
   - token: `uzt4z-lp777-77774-qaabq-cai`
   - opend_assets: `ulvla-h7777-77774-qaacq-cai`
   - internet_identity: `uxrrr-q7777-77774-qaaaq-cai`

2. **Local Internet Identity** – App uses your local replica for auth (no mainnet).

3. **Dependencies** – `npm install` and `pod install` completed.

---

## Prerequisites

1. **dfx running** – From project root:
   ```bash
   cd /Users/pravinbhatta/opend\ 2
   dfx start
   dfx deploy
   ```

2. **Metro** – In one terminal:
   ```bash
   cd /Users/pravinbhatta/opend\ 2/mobile_app
   npm start
   ```

---

## Run on iOS

### If you see Xcode/Simulator errors

You may need to run:
```bash
sudo xcodebuild -runFirstLaunch
```

Or open Xcode once to accept licenses and install components.

### Option A: React Native CLI

```bash
cd /Users/pravinbhatta/opend\ 2/mobile_app
npm run ios
```

### Option B: Xcode (if CLI fails)

1. Open `mobile_app/ios/OpenDMobile.xcworkspace` in Xcode (use `.xcworkspace`, not `.xcodeproj`).
2. Select a simulator (e.g. iPhone 15).
3. Press **Run** (▶) or `Cmd+R`.
4. Ensure Metro is running in another terminal (`npm start`).

---

## Run on Android

1. Start Android Emulator (or connect a device).
2. Run:
   ```bash
   cd /Users/pravinbhatta/opend\ 2/mobile_app
   npm run android
   ```

---

## Quick Checklist

- [ ] `dfx start` and `dfx deploy` from main project root
- [ ] Metro running: `cd mobile_app && npm start`
- [ ] iOS: `npm run ios` or build from Xcode
- [ ] Android: `npm run android`

---

## Troubleshooting

### "CoreSimulator" or "Connection refused" errors
- Run `xcodebuild -runFirstLaunch` (already run during setup)
- Open **Simulator.app** first (search in Spotlight), then run `npm run ios`
- Or open Xcode → **OpenDMobile.xcworkspace** → select a simulator → press Run (▶)
- If issues persist, restart your Mac to reset CoreSimulatorService

### "Connection closed" or "Cannot connect to IC" on II login
- The mobile browser cannot reach localhost. Use **npm run mobile-proxy** – see [MOBILE_II_SETUP.md](./MOBILE_II_SETUP.md).

### Metro not connecting
- Start Metro first: `npm start`
- Then run `npm run ios` or `npm run android` in a separate terminal
