import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, InteractionManager, Linking } from 'react-native';
import { AuthClient } from '@dfinity/auth-client';
import { Identity } from '@dfinity/agent';
import { IDENTITY_PROVIDER } from '../config/canisters';
import { AsyncStorageAdapter } from '../storage/AsyncStorageAdapter';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
    isAuthenticated: boolean;
    identity: Identity | null;
    login: () => void;
    logout: () => void;
    authReady: boolean;
    authClient: AuthClient | null;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    identity: null,
    login: () => { },
    logout: () => { },
    authReady: false,
    authClient: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authClient, setAuthClient] = useState<AuthClient | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [identity, setIdentity] = useState<Identity | null>(null);
    const [authReady, setAuthReady] = useState(false);

    const loadAuthState = useCallback(async () => {
        const client = await AuthClient.create({
            storage: new AsyncStorageAdapter(),
            keyType: 'Ed25519',
            idleOptions: { disableIdle: true, disableDefaultIdleCallback: true },
        });
        setAuthClient(client);
        const isAuth = await client.isAuthenticated();
        const id = isAuth ? client.getIdentity() : null;
        __DEV__ && console.log('[Auth] loadAuthState:', { isAuth, principal: id?.getPrincipal()?.toString() });
        setIsAuthenticated(isAuth);
        setIdentity(id);
    }, []);

    useEffect(() => {
        loadAuthState()
            .catch((err) => console.error('AuthClient.create failed:', err))
            .finally(() => setAuthReady(true));
    }, [loadAuthState]);

    const processedUrlRef = useRef<string | null>(null);

    const processAuthCallback = useCallback(async (url: string) => {
        if (!url || !url.startsWith('opend://auth#')) return;
        if (processedUrlRef.current === url) return;
        processedUrlRef.current = url;
        __DEV__ && console.log('[Auth] processAuthCallback received:', url.substring(0, 60) + '...');
        try {
            const hash = url.split('#')[1];
            if (!hash) {
                __DEV__ && console.log('[Auth] processAuthCallback: no hash in URL');
                return;
            }
            const decoded = decodeURIComponent(escape(atob(hash)));
            const parsed = JSON.parse(decoded) as { key: string; delegation: string };
            const keyStr = typeof parsed.key === 'string' ? parsed.key : JSON.stringify(parsed.key);
            const delStr = typeof parsed.delegation === 'string' ? parsed.delegation : JSON.stringify(parsed.delegation);
            await AsyncStorage.setItem('ic-identity', keyStr);
            await AsyncStorage.setItem('ic-delegation', delStr);
            __DEV__ && console.log('[Auth] processAuthCallback: stored credentials, calling loadAuthState');
            await loadAuthState();
        } catch (e) {
            console.error('[Auth] Failed to process auth callback:', e);
            processedUrlRef.current = null;
        }
    }, [loadAuthState]);

    useEffect(() => {
        const handleDeepLink = (event: { url: string }) => processAuthCallback(event.url);
        const sub = Linking.addEventListener('url', handleDeepLink);
        const tryInitialUrl = () => {
            Linking.getInitialURL().then((url) => {
                __DEV__ && url && console.log('[Auth] getInitialURL:', url.substring(0, 80) + (url.length > 80 ? '...' : ''));
                if (url) processAuthCallback(url);
            });
        };
        tryInitialUrl();
        const t1 = setTimeout(tryInitialUrl, 300);
        const t2 = setTimeout(tryInitialUrl, 800);
        __DEV__ && console.log('[Auth] Linking listeners registered (url event + getInitialURL)');
        return () => {
            sub.remove();
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [processAuthCallback]);

    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                __DEV__ && console.log('[Auth] AppState active, checking URL');
                InteractionManager.runAfterInteractions(() => {
                    Linking.getInitialURL().then((url) => {
                        __DEV__ && url && console.log('[Auth] AppState active getInitialURL:', url.substring(0, 80) + (url.length > 80 ? '...' : ''));
                        if (url?.startsWith('opend://auth#')) {
                            processAuthCallback(url);
                        } else {
                            loadAuthState();
                        }
                    });
                });
            }
        });
        return () => sub.remove();
    }, [loadAuthState, processAuthCallback]);

    const login = async () => {
        // Open the II auth bridge in the browser. The bridge runs the II flow, captures
        // the delegation, and redirects to opend://auth#data. Our deep link handler
        // stores credentials and refreshes auth state. Do NOT use authClient.login()
        // here – that expects II protocol messages; our bridge handles the full flow.
        Linking.openURL(IDENTITY_PROVIDER).catch((err) => console.error('Failed to open login', err));
    };

    const logout = async () => {
        if (!authClient) return;
        await authClient.logout();
        setIsAuthenticated(false);
        setIdentity(null);
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            identity,
            login,
            logout,
            authReady,
            authClient,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
