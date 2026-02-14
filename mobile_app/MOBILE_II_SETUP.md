# Mobile II Login – Setup

## Simulator vs Physical Device

**iOS Simulator** runs ON your Mac. It can reach `localhost` / `127.0.0.1` directly. No proxy needed.

**Physical iPhone** is a separate device. It cannot reach your Mac’s localhost. Use the proxy (see below).

---

## Simulator (iOS)

1. **Keep `DEV_HOST_OVERRIDE` as `null`** in `mobile_app/src/config/canisters.ts`.

2. **Start dfx:**
   ```bash
   dfx start
   dfx deploy
   ```

3. **Confirm the main app works in your Mac browser:**
   Open: `http://127.0.0.1:8000/?canisterId=ulvla-h7777-77774-qaacq-cai`
   
   You should see “Tap the button below to sign in with Internet Identity”. If that works, mobile will too.

4. **Run the app:**
   ```bash
   cd mobile_app
   npm start
   npm run ios
   ```

5. Tap Login. Safari opens the main app with mobile=1. Tap Login there, complete II, then you're redirected back to the app.

---

## Physical Device

1. **Start dfx and the proxy:**
   ```bash
   # Terminal 1
   dfx start && dfx deploy

   # Terminal 2
   npm run mobile-proxy
   ```

2. **Configure the app** with the proxy URL in `canisters.ts`:
   ```ts
   export const DEV_HOST_OVERRIDE = 'http://192.168.1.100:9180';  // Use the URL the proxy prints
   ```

3. **Rebuild** the app. Phone and Mac must be on the same Wi‑Fi.

---

## Troubleshooting

**Blank page or "connection closed"**

- First verify the main app works: open `http://127.0.0.1:8000/?canisterId=ulvla-h7777-77774-qaacq-cai` in your Mac browser and click Login.
- If that fails, run `npm run build`, `dfx deploy`, and ensure `dfx start` is running.

**“Connection closed”**

- Verify the main app works in your Mac browser first (step 3).
- Physical device: Use the proxy and the same Wi‑Fi for phone and Mac.
