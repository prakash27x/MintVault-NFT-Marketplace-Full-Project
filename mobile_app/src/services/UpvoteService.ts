import { getSupabaseClient } from '../config/supabase';

export interface UpvoteInfo {
    count: number;
    hasUpvoted: boolean;
}

export class UpvoteService {
    async getUpvoteCounts(nftIds: string[]): Promise<Record<string, number>> {
        const counts: Record<string, number> = {};
        for (const id of nftIds) counts[id] = 0;
        if (nftIds.length === 0) return counts;
        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('nft_upvotes')
                .select('nft_id')
                .in('nft_id', nftIds);
            if (error) {
                console.error('UpvoteService getUpvoteCounts error:', error);
                return counts;
            }
            for (const r of data ?? []) {
                counts[r.nft_id] = (counts[r.nft_id] ?? 0) + 1;
            }
            return counts;
        } catch (e) {
            console.error('UpvoteService getUpvoteCounts:', e);
            return counts;
        }
    }

    async getUpvoteCount(nftId: string): Promise<number> {
        try {
            const supabase = getSupabaseClient();
            const { count, error } = await supabase
                .from('nft_upvotes')
                .select('*', { count: 'exact', head: true })
                .eq('nft_id', nftId);
            if (error) {
                console.error('UpvoteService getUpvoteCount error:', error);
                return 0;
            }
            return count ?? 0;
        } catch (e) {
            console.error('UpvoteService getUpvoteCount:', e);
            return 0;
        }
    }

    async hasUserUpvoted(nftId: string, userPrincipal: string): Promise<boolean> {
        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('nft_upvotes')
                .select('id')
                .eq('nft_id', nftId)
                .eq('user_principal', userPrincipal)
                .maybeSingle();
            if (error) {
                console.error('UpvoteService hasUserUpvoted error:', error);
                return false;
            }
            return !!data;
        } catch (e) {
            console.error('UpvoteService hasUserUpvoted:', e);
            return false;
        }
    }

    async getUpvoteInfo(
        nftId: string,
        userPrincipal: string
    ): Promise<UpvoteInfo> {
        const [count, hasUpvoted] = await Promise.all([
            this.getUpvoteCount(nftId),
            this.hasUserUpvoted(nftId, userPrincipal),
        ]);
        return { count, hasUpvoted };
    }

    async toggleUpvote(
        nftId: string,
        userPrincipal: string,
        ownerPrincipal: string
    ): Promise<'upvoted' | 'removed'> {
        const supabase = getSupabaseClient();
        const hasUpvoted = await this.hasUserUpvoted(nftId, userPrincipal);

        if (hasUpvoted) {
            const { error } = await supabase
                .from('nft_upvotes')
                .delete()
                .eq('nft_id', nftId)
                .eq('user_principal', userPrincipal);
            if (error) {
                console.error('UpvoteService removeUpvote error:', error);
                throw new Error(error.message);
            }
            return 'removed';
        } else {
            const { error } = await supabase.from('nft_upvotes').insert({
                nft_id: nftId,
                user_principal: userPrincipal,
                owner_principal: ownerPrincipal,
            });
            if (error) {
                console.error('UpvoteService upvote error:', error);
                throw new Error(error.message);
            }
            return 'upvoted';
        }
    }

    async getUserUpvotedNFTIds(userPrincipal: string): Promise<string[]> {
        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('nft_upvotes')
                .select('nft_id')
                .eq('user_principal', userPrincipal)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('UpvoteService getUserUpvotedNFTIds error:', error);
                return [];
            }
            return (data ?? []).map((r) => r.nft_id);
        } catch (e) {
            console.error('UpvoteService getUserUpvotedNFTIds:', e);
            return [];
        }
    }

    async getUpvotedOwnerIds(userPrincipal: string): Promise<Set<string>> {
        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('nft_upvotes')
                .select('owner_principal')
                .eq('user_principal', userPrincipal)
                .not('owner_principal', 'is', null);
            if (error) {
                console.error('UpvoteService getUpvotedOwnerIds error:', error);
                return new Set();
            }
            const ids = new Set<string>();
            for (const r of data ?? []) {
                if (r.owner_principal) ids.add(r.owner_principal);
            }
            return ids;
        } catch (e) {
            console.error('UpvoteService getUpvotedOwnerIds:', e);
            return new Set();
        }
    }
}

export const upvoteService = new UpvoteService();
