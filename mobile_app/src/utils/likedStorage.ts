import AsyncStorage from '@react-native-async-storage/async-storage';

export const SAVED_KEY = '@mintvault_liked_nfts';

export type SavedEntry = string | { id: string; owner: string };

export function getSavedKey(principal: string): string {
    return `${SAVED_KEY}_${principal}`;
}

function parseSaved(raw: string | null): SavedEntry[] {
    if (!raw) return [];
    try {
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

export function getSavedIds(entries: SavedEntry[]): string[] {
    return entries.map((e) => (typeof e === 'string' ? e : e.id));
}

export function getSavedOwnerIds(entries: SavedEntry[]): Set<string> {
    const owners = new Set<string>();
    for (const e of entries) {
        if (typeof e === 'object' && e?.owner) {
            owners.add(e.owner);
        }
    }
    return owners;
}

export async function getSavedEntries(principal: string): Promise<SavedEntry[]> {
    const key = getSavedKey(principal);
    const raw = await AsyncStorage.getItem(key);
    return parseSaved(raw);
}

export const LIKED_KEY = SAVED_KEY;
