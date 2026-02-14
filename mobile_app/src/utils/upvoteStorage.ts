import AsyncStorage from '@react-native-async-storage/async-storage';

export const UPVOTED_KEY = '@mintvault_upvoted_nfts';

export type UpvotedEntry = string | { id: string; owner: string };

export function getUpvotedKey(principal: string): string {
    return `${UPVOTED_KEY}_${principal}`;
}

function parseUpvoted(raw: string | null): UpvotedEntry[] {
    if (!raw) return [];
    try {
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

export function getUpvotedIds(entries: UpvotedEntry[]): string[] {
    return entries.map((e) => (typeof e === 'string' ? e : e.id));
}

export function getUpvotedOwnerIds(entries: UpvotedEntry[]): Set<string> {
    const owners = new Set<string>();
    for (const e of entries) {
        if (typeof e === 'object' && e?.owner) {
            owners.add(e.owner);
        }
    }
    return owners;
}

export async function getUpvotedEntries(principal: string): Promise<UpvotedEntry[]> {
    const key = getUpvotedKey(principal);
    const raw = await AsyncStorage.getItem(key);
    return parseUpvoted(raw);
}
