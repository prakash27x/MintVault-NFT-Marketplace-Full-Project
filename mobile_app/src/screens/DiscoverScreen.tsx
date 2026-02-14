import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { openDService, NFT } from '../services/OpenDService';
import { NFTCard } from '../components/NFTCard';
import { getSavedEntries, getSavedIds } from '../utils/likedStorage';
import { upvoteService } from '../services/UpvoteService';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { fonts, fontWeights } from '../theme/fonts';

type FilterMode = 'all' | 'recommended';

export const DiscoverScreen = () => {
    const { identity } = useAuth();
    const insets = useSafeAreaInsets();
    const [allNfts, setAllNfts] = useState<NFT[]>([]);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [upvoteCounts, setUpvoteCounts] = useState<Record<string, number>>({});
    const [filter, setFilter] = useState<FilterMode>('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNFTs = useCallback(async () => {
        const principalStr = identity?.getPrincipal()?.toText();
        if (!principalStr) {
            setAllNfts([]);
            setSavedIds(new Set());
            setUpvoteCounts({});
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            const [listedNfts, savedEntries] = await Promise.all([
                openDService.getListedNFTs(identity ?? undefined),
                getSavedEntries(principalStr),
            ]);
            const ids = listedNfts.map((n) => n.id.toText());
            const counts = await upvoteService.getUpvoteCounts(ids);
            setAllNfts(listedNfts);
            setSavedIds(new Set(getSavedIds(savedEntries)));
            setUpvoteCounts(counts);
        } catch (error) {
            console.error('Error fetching NFTs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [identity]);

    useEffect(() => {
        fetchNFTs();
    }, [fetchNFTs]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNFTs();
    };

    const myPrincipalStr = identity?.getPrincipal()?.toText() ?? '';

    const sortByUpvoteCount = (a: NFT, b: NFT) => {
        const ca = upvoteCounts[a.id.toText()] ?? 0;
        const cb = upvoteCounts[b.id.toText()] ?? 0;
        return cb - ca;
    };

    const tier1 = allNfts.filter((n) => {
        const id = n.id.toText();
        const saved = savedIds.has(id);
        const count = upvoteCounts[id] ?? 0;
        const mine = n.owner.toText() === myPrincipalStr;
        return saved && count > 0 && !mine;
    }).sort(sortByUpvoteCount);

    const tier2 = allNfts.filter((n) => {
        const id = n.id.toText();
        const saved = savedIds.has(id);
        const count = upvoteCounts[id] ?? 0;
        const mine = n.owner.toText() === myPrincipalStr;
        return saved && count === 0 && !mine;
    });

    const tier3 = allNfts.filter((n) => {
        const id = n.id.toText();
        const saved = savedIds.has(id);
        const count = upvoteCounts[id] ?? 0;
        const mine = n.owner.toText() === myPrincipalStr;
        return !saved && count > 0 && !mine;
    }).sort(sortByUpvoteCount);

    const tier4 = allNfts.filter((n) => {
        const id = n.id.toText();
        const saved = savedIds.has(id);
        const count = upvoteCounts[id] ?? 0;
        const mine = n.owner.toText() === myPrincipalStr;
        return !saved && count === 0 && !mine;
    });

    const tier5 = allNfts.filter((n) => n.owner.toText() === myPrincipalStr);

    const recommendedNfts = [...tier1, ...tier2, ...tier3];
    const allSortedNfts = [...tier1, ...tier2, ...tier3, ...tier4, ...tier5];
    const displayedNfts =
        filter === 'recommended' ? recommendedNfts : allSortedNfts;

    const handleBuy = async (
        nftId: import('@dfinity/principal').Principal,
        sellerId: import('@dfinity/principal').Principal,
        price: bigint
    ) => {
        if (!identity) return;
        const result = await openDService.buyNFT(
            nftId,
            sellerId,
            price,
            identity.getPrincipal(),
            identity
        );
        if (result !== 'Success') throw new Error(result);
        fetchNFTs();
    };

    const tabBarHeight = 56 + Math.max(insets.bottom, 8);

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.purpleLight} />
                <Text style={styles.loadingText}>Loading NFTs...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <Text style={styles.sectionLabel}>DISCOVER</Text>
                <Text style={styles.title}>Explore NFTs</Text>
                <View style={styles.toggleRow}>
                    <TouchableOpacity
                        style={[
                            styles.toggleBtn,
                            filter === 'recommended' && styles.toggleBtnActive,
                        ]}
                        onPress={() => setFilter('recommended')}
                    >
                        <Text
                            style={[
                                styles.toggleText,
                                filter === 'recommended' &&
                                    styles.toggleTextActive,
                            ]}
                        >
                            Recommended
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.toggleBtn,
                            filter === 'all' && styles.toggleBtnActive,
                        ]}
                        onPress={() => setFilter('all')}
                    >
                        <Text
                            style={[
                                styles.toggleText,
                                filter === 'all' && styles.toggleTextActive,
                            ]}
                        >
                            All
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={displayedNfts}
                renderItem={({ item }) => {
                    const myPrincipal = identity?.getPrincipal();
                    const canBuy = identity && myPrincipal && item.owner.toText() !== myPrincipal.toText();
                    return (
                        <NFTCard
                            name={item.name}
                            image={item.image}
                            price={item.price}
                            owner={item.owner}
                            currentUserPrincipal={myPrincipal ?? undefined}
                            role="discover"
                            nftId={item.id}
                            onBuy={canBuy ? handleBuy : undefined}
                            onRefresh={fetchNFTs}
                            showSaveButton
                            showUpvoteButton
                        />
                    );
                }}
                keyExtractor={(item) => item.id.toText()}
                numColumns={1}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingBottom: tabBarHeight + 24 },
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.purpleLight}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {filter === 'recommended'
                                ? 'No recommendations. Save or upvote NFTs to see them here.'
                                : 'No NFTs found.'}
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    sectionLabel: {
        fontFamily: "Bebas Neue",
        fontSize: 16,
        letterSpacing: 3,
        color: colors.purpleLight,
        marginBottom: 4,
    },
    title: {
        fontFamily: "Bebas Neue",
        fontSize: 28,
        letterSpacing: 0.5,
        color: colors.white,
        marginBottom: 16,
    },
    toggleRow: {
        flexDirection: 'row',
        gap: 12,
    },
    toggleBtn: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 10,
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.2)',
    },
    toggleBtnActive: {
        backgroundColor: 'rgba(124, 58, 237, 0.25)',
        borderColor: colors.purpleLight,
    },
    toggleText: {
        fontFamily: fonts.interSemiBold,
        fontWeight: fontWeights.interSemiBold,
        fontSize: 14,
        color: colors.grayText,
    },
    toggleTextActive: {
        color: colors.purpleLight,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: colors.grayText,
        marginTop: 12,
        fontSize: 15,
    },
    emptyContainer: {
        padding: 48,
        alignItems: 'center',
    },
    emptyText: {
        color: colors.grayText,
        fontSize: 16,
    },
});
