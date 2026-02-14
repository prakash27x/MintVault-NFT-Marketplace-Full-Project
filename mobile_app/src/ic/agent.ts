import { HttpAgent, Identity } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { IC_HOST, IDENTITY_PROVIDER } from '../config/canisters';
import { AsyncStorageAdapter } from '../storage/AsyncStorageAdapter';

export async function createAgent(identity?: Identity) {
    const agent = new HttpAgent({
        identity,
        host: IC_HOST,
    });

    // Fetch root key for local development
    if (IC_HOST && (IC_HOST.includes('127.0.0.1') || IC_HOST.includes('10.0.2.2'))) {
        try {
            await agent.fetchRootKey();
        } catch (err) {
            console.warn('Unable to fetch root key. Ensure local replica is running');
        }
    }

    return agent;
}

export async function getAuthClient() {
    return await AuthClient.create({
        storage: new AsyncStorageAdapter(),
        keyType: 'Ed25519',
        idleOptions: {
            disableIdle: true,
            disableDefaultIdleCallback: true,
        },
    });
}
