import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'ic-';

/**
 * AuthClientStorage implementation using React Native AsyncStorage.
 * Use this instead of IdbStorage (IndexedDB) which isn't available in RN.
 */
export class AsyncStorageAdapter {
    async get(key: string): Promise<string | object | null> {
        try {
            const value = await AsyncStorage.getItem(PREFIX + key);
            return value;
        } catch {
            return null;
        }
    }

    async set(key: string, value: string | object): Promise<void> {
        const toStore =
            typeof value === 'string' ? value : JSON.stringify(value);
        await AsyncStorage.setItem(PREFIX + key, toStore);
    }

    async remove(key: string): Promise<void> {
        await AsyncStorage.removeItem(PREFIX + key);
    }
}
