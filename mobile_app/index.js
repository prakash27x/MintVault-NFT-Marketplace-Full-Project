import './shim';
/**
 * @format
 */

// Set canister IDs before any dfx declarations load (they call createActor(process.env.CANISTER_ID_*) at import time).
// React Native does not inject process.env like webpack; declarations crash otherwise.
import { CANISTER_IDS } from './src/config/canisters';
process.env.CANISTER_ID_OPEND = CANISTER_IDS.opend;
process.env.CANISTER_ID_TOKEN = CANISTER_IDS.token;
process.env.CANISTER_ID_OPEND_ASSETS = CANISTER_IDS.opend_assets;
process.env.CANISTER_ID_INTERNET_IDENTITY = CANISTER_IDS.internet_identity;
process.env.CANISTER_ID_NFT = CANISTER_IDS.opend; // placeholder; NFT actors use dynamic IDs
process.env.DFX_NETWORK = process.env.DFX_NETWORK || 'local';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
