/**
 * React Native polyfills for DFinity/IC and browser APIs.
 * Must be imported first (see index.js).
 */
import 'react-native-get-random-values';
import { setupURLPolyfill } from 'react-native-url-polyfill';
import { Buffer } from 'buffer';

if (typeof globalThis === 'undefined') global.globalThis = global;

setupURLPolyfill();

global.Buffer = Buffer;

// process - required by many Node-style modules
global.process = global.process || require('process');
if (!global.process.env) global.process.env = {};
if (!global.process.version) global.process.version = '';

// TextDecoder/TextEncoder - required by @dfinity/cbor. fast-text-encoding assigns to global when required.
require('fast-text-encoding');

// @dfinity/candid and @dfinity/agent use TextDecoder with { fatal: true }, which React Native/Hermes does not support.
// Wrap TextDecoder to strip the fatal option before delegating to the native implementation.
(function () {
  const OrigTextDecoder = global.TextDecoder;
  if (!OrigTextDecoder) return;
  global.TextDecoder = class TextDecoder {
    constructor(label, options) {
      let opts = options;
      if (options && typeof options === 'object') {
        opts = { ...options };
        delete opts.fatal;
        if (Object.keys(opts).length === 0) opts = undefined;
      }
      this._decoder = new OrigTextDecoder(label, opts);
    }
    decode(input) {
      return this._decoder.decode(input);
    }
    get encoding() {
      return this._decoder.encoding;
    }
    get fatal() {
      return this._decoder.fatal;
    }
    get ignoreBOM() {
      return this._decoder.ignoreBOM;
    }
  };
})();

// localStorage - React Native doesn't have it. AuthClient uses AsyncStorageAdapter, but some code paths reference it.
const _memStore = {};
const localStoragePolyfill = {
    getItem: (k) => _memStore[k] ?? null,
    setItem: (k, v) => { _memStore[k] = String(v); },
    removeItem: (k) => { delete _memStore[k]; },
    clear: () => { for (const k of Object.keys(_memStore)) delete _memStore[k]; },
    length: 0,
    key: () => null,
};
global.localStorage = localStoragePolyfill;

// window polyfill for @dfinity/auth-client
const { Linking } = require('react-native');
const _messageListeners = [];
const fakeWindow = {
    addEventListener: (ev, fn) => { if (ev === 'message') _messageListeners.push(fn); },
    removeEventListener: (ev, fn) => {
        if (ev === 'message') {
            const i = _messageListeners.indexOf(fn);
            if (i >= 0) _messageListeners.splice(i, 1);
        }
    },
    open: (url) => {
        Linking.openURL(url).catch(() => {});
        return {
            closed: false,
            close: () => {},
        };
    },
    location: {
        reload: () => {},
        href: '',
    },
};
if (typeof global.window === 'undefined') global.window = fakeWindow;
else {
    if (!global.window.open) global.window.open = fakeWindow.open;
    if (!global.window.addEventListener) global.window.addEventListener = fakeWindow.addEventListener;
    if (!global.window.removeEventListener) global.window.removeEventListener = fakeWindow.removeEventListener;
    if (!global.window.location) global.window.location = fakeWindow.location;
}

// location - auth-client may reference it directly
if (typeof global.location === 'undefined') global.location = global.window.location;

// btoa/atob - base64 encoding
if (typeof btoa === 'undefined') {
    global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
}
if (typeof atob === 'undefined') {
    global.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');
}
