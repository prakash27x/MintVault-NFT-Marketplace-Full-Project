import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { openDService, NFT } from '../services/OpenDService';
import { NFTCard } from '../components/NFTCard';
import { colors } from '../theme/colors';
import { fonts, fontWeights } from '../theme/fonts';

export const CollectionScreen = () => {
    const { identity } = useAuth();
    const insets = useSafeAreaInsets();
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNFTs = async () => {
        if (!identity) {
            setNfts([]);
            setLoading(false);
            return;
        }
        try {
            const principal = identity.getPrincipal();
            const owned = await openDService.getOwnedNFTs(principal, identity);
            setNfts(owned);
        } catch (error) {
            console.error('Error fetching owned NFTs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNFTs();
    }, [identity]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNFTs();
    };

    const handleSell = async (
        nftId: import('@dfinity/principal').Principal,
        price: bigint
    ) => {
        if (!identity) return;
        const result = await openDService.sellNFT(nftId, price, identity);
        if (result !== 'Success') throw new Error(result);
    };

    const tabBarHeight = 56 + Math.max(insets.bottom, 8);

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.purpleLight} />
                <Text style={styles.loadingText}>Loading your NFTs...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <Text style={styles.sectionLabel}>COLLECTION</Text>
                <Text style={styles.title}>My NFTs</Text>
            </View>

            <FlatList
                data={nfts}
                renderItem={({ item }) => (
                    <NFTCard
                        name={item.name}
                        image={item.image}
                        price={item.price}
                        owner={item.owner}
                        currentUserPrincipal={identity?.getPrincipal()}
                        role="collection"
                        nftId={item.id}
                        onSell={handleSell}
                        onRefresh={fetchNFTs}
                    />
                )}
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
                        <Text style={styles.emptyText}>No NFTs yet. Mint one!</Text>
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
        fontWeight: fontWeights.interSemiBold,
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
