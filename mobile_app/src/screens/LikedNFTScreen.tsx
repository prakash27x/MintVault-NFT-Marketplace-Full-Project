import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Principal } from '@dfinity/principal';
import { openDService, NFT } from '../services/OpenDService';
import { NFTCard } from '../components/NFTCard';
import { getSavedEntries, getSavedIds } from '../utils/likedStorage';
import { AppHeader } from '../components/AppHeader';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { fonts, fontWeights } from '../theme/fonts';

export const LikedNFTScreen = () => {
    const { identity } = useAuth();
    const insets = useSafeAreaInsets();
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSavedNFTs = useCallback(async () => {
        const principalStr = identity?.getPrincipal()?.toText();
        if (!principalStr) {
            setNfts([]);
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            const entries = await getSavedEntries(principalStr);
            const idList = getSavedIds(entries);

            if (idList.length === 0) {
                setNfts([]);
                return;
            }

            const myPrincipalStr = identity?.getPrincipal()?.toText();
            const results: NFT[] = [];
            for (const idStr of idList) {
                try {
                    const nftId = Principal.fromText(idStr);
                    const nft = await openDService.getNFTById(
                        nftId,
                        identity ?? undefined
                    );
                    if (
                        nft &&
                        nft.owner.toText() !== myPrincipalStr &&
                        nft.price > BigInt(0)
                    ) {
                        results.push(nft);
                    }
                } catch {
                    // Skip invalid IDs
                }
            }
            setNfts(results);
        } catch (error) {
            console.error('Error fetching saved NFTs:', error);
            setNfts([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [identity]);

    useFocusEffect(
        useCallback(() => {
            fetchSavedNFTs();
        }, [fetchSavedNFTs])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchSavedNFTs();
    };

    const handleBuy = async (
        nftId: Principal,
        sellerId: Principal,
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
        fetchSavedNFTs();
    };

    const bottomPad = insets.bottom + 24;
    const myPrincipal = identity?.getPrincipal();

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.purpleLight} />
                <Text style={styles.loadingText}>Loading saved NFTs...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <AppHeader />
            <View style={[styles.sectionHeader, { paddingTop: 8 }]}>
                <Text style={styles.sectionLabel}>SAVED</Text>
                <Text style={styles.title}>My Saved NFTs</Text>
            </View>

            <FlatList
                data={nfts}
                renderItem={({ item }) => {
                    const canBuy =
                        identity &&
                        myPrincipal &&
                        item.owner.toText() !== myPrincipal.toText() &&
                        item.price > BigInt(0);
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
                            onRefresh={fetchSavedNFTs}
                            showSaveButton
                            showUpvoteButton
                        />
                    );
                }}
                keyExtractor={(item) => item.id.toText()}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingBottom: bottomPad },
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
                            No saved NFTs yet. Save some from Discover!
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
    sectionHeader: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    sectionLabel: {
        fontFamily: fonts.interSemiBold,
        fontWeight: fontWeights.interSemiBold,
        fontSize: 11,
        letterSpacing: 3,
        color: colors.purpleLight,
        marginBottom: 4,
    },
    title: {
        fontFamily: fonts.bebas,
        fontSize: 28,
        letterSpacing: 0.5,
        color: colors.white,
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
        textAlign: 'center',
    },
});
