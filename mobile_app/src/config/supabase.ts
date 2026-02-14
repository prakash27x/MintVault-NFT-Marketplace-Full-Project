import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase config for NFT upvotes (mobile app only)
// Replace with your anon key from Supabase Dashboard → Settings → API
const SUPABASE_URL = 'https://prffnvbkmjzhtnafirxi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_IaXKyQU9tgtSqY0yt3ERyw_R9LLo3aV';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
    if (!client) {
        client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return client;
}
