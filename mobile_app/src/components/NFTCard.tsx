import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Alert,
    TextInput,
    Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Principal } from '@dfinity/principal';
import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrincipalBox } from './PrincipalBox';
import { EllipsisLoader } from './EllipsisLoader';
import { colors } from '../theme/colors';
import { fonts, fontWeights } from '../theme/fonts';

const { width } = Dimensions.get('window');

const BookmarkIcon = ({ filled }: { filled: boolean }) => {
    const color = filled ? colors.purpleLight : colors.grayText;
    return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" opacity={filled ? 1 : 0.85}>
            <Path
                d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                stroke={color}
                strokeWidth={filled ? 2.5 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={filled ? color : 'none'}
            />
        </Svg>
    );
};

const UpvoteIcon = ({ filled }: { filled: boolean }) => {
    const color = filled ? colors.purpleLight : colors.grayText;
    return (
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 4l8 8h-5v8h-6v-8H4l8-8z"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={filled ? color : 'none'}
            />
        </Svg>
    );
};
const CARD_PADDING = 16;
const CARD_MAX_WIDTH = 280;
const CARD_WIDTH = Math.min(width - CARD_PADDING * 2, CARD_MAX_WIDTH);

import { getSavedKey, LIKED_KEY } from '../utils/likedStorage';
import { upvoteService } from '../services/UpvoteService';

export { LIKED_KEY };

interface NFTCardProps {
    name: string;
    image: Uint8Array | number[];
    price: bigint;
    owner: Principal;
    currentUserPrincipal?: Principal;
    role?: 'discover' | 'collection';
    nftId?: Principal;
    onBuy?: (nftId: Principal, sellerId: Principal, price: bigint) => Promise<void>;
    onSell?: (nftId: Principal, price: bigint) => Promise<void>;
    onRefresh?: () => void;
    showSaveButton?: boolean;
    showUpvoteButton?: boolean;
    showPrice?: boolean;
}

export const NFTCard: React.FC<NFTCardProps> = ({
    name,
    image,
    price,
    owner,
    currentUserPrincipal,
    role,
    nftId,
    onBuy,
    onSell,
    onRefresh,
    showSaveButton = false,
    showUpvoteButton = false,
    showPrice = true,
}) => {
    const [sellPrice, setSellPrice] = useState('');
    const [showSellInput, setShowSellInput] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [upvoted, setUpvoted] = useState(false);
    const [upvoteCount, setUpvoteCount] = useState(0);
    const isListed = price > BigInt(0);

    const nftIdStr = nftId?.toText() ?? '';
    const ownerStr = owner.toText();
    const isOwner = !!(
        currentUserPrincipal &&
        currentUserPrincipal.toText() === ownerStr
    );

    const principalStrForStorage = currentUserPrincipal?.toText() ?? '';

    useEffect(() => {
        if (!showSaveButton || !nftIdStr || !principalStrForStorage) return;
        const key = getSavedKey(principalStrForStorage);
        AsyncStorage.getItem(key).then((raw) => {
            try {
                const arr = raw ? JSON.parse(raw) : [];
                const ids = Array.isArray(arr)
                    ? arr.map((e: string | { id: string }) =>
                          typeof e === 'string' ? e : e?.id
                      )
                    : [];
                setSaved(ids.includes(nftIdStr));
            } catch {
                setSaved(false);
            }
        });
    }, [showSaveButton, nftIdStr, principalStrForStorage]);

    useEffect(() => {
        if (!showUpvoteButton || !nftIdStr) return;
        upvoteService
            .getUpvoteInfo(nftIdStr, principalStrForStorage)
            .then(({ count, hasUpvoted }) => {
                setUpvoteCount(count);
                setUpvoted(hasUpvoted);
            })
            .catch(() => {
                setUpvoteCount(0);
                setUpvoted(false);
            });
    }, [showUpvoteButton, nftIdStr, principalStrForStorage]);

    const toggleSave = async () => {
        if (!nftIdStr || !principalStrForStorage) return;
        try {
            const key = getSavedKey(principalStrForStorage);
            const raw = await AsyncStorage.getItem(key);
            const arr = raw ? JSON.parse(raw) : [];
            const next = Array.isArray(arr) ? [...arr] : [];
            const idx = next.findIndex(
                (e: string | { id: string }) =>
                    (typeof e === 'string' ? e : e?.id) === nftIdStr
            );
            if (idx >= 0) next.splice(idx, 1);
            else next.push({ id: nftIdStr, owner: ownerStr });
            await AsyncStorage.setItem(key, JSON.stringify(next));
            setSaved(!saved);
        } catch {
            setSaved(!saved);
        }
    };

    const toggleUpvote = async () => {
        if (!nftIdStr || !principalStrForStorage) return;
        try {
            const result = await upvoteService.toggleUpvote(
                nftIdStr,
                principalStrForStorage,
                ownerStr
            );
            if (result === 'upvoted') {
                setUpvoted(true);
                setUpvoteCount((c) => c + 1);
            } else {
                setUpvoted(false);
                setUpvoteCount((c) => Math.max(0, c - 1));
            }
            onRefresh?.();
        } catch {
            setUpvoted(!upvoted);
            setUpvoteCount(upvoted ? Math.max(0, upvoteCount - 1) : upvoteCount + 1);
        }
    };

    const imageData = image && (Array.isArray(image) ? new Uint8Array(image) : image);
    const base64Image =
        imageData && imageData.length > 0 ? Buffer.from(imageData).toString('base64') : '';
    const imageSource = base64Image ? { uri: `data:image/png;base64,${base64Image}` } : null;

    const handleBuy = async () => {
        if (!onBuy || !nftId) return;
        setLoading(true);
        try {
            await onBuy(nftId, owner, price);
            onRefresh?.();
        } catch (e: unknown) {
            Alert.alert('Error', String(e));
        } finally {
            setLoading(false);
        }
    };

    const handleSellConfirm = async () => {
        if (!onSell || !nftId || !sellPrice || isNaN(Number(sellPrice))) return;
        setLoading(true);
        try {
            await onSell(nftId, BigInt(sellPrice));
            setShowSellInput(false);
            setSellPrice('');
            onRefresh?.();
        } catch (e: unknown) {
            Alert.alert('Error', String(e));
        } finally {
            setLoading(false);
        }
    };

    const imageBlurred = loading && role === 'collection';

    return (
        <View style={styles.card}>
            {/* Image - Instagram-style full-width */}
            <View style={styles.imageWrap}>
                {imageSource ? (
                    <Image
                        source={imageSource}
                        style={styles.image}
                        blurRadius={imageBlurred ? 4 : 0}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.image, styles.imagePlaceholder]} />
                )}
                {loading && (
                    <View style={styles.loaderOverlay}>
                        <EllipsisLoader />
                    </View>
                )}
                {showSaveButton && !isOwner && (
                    <TouchableOpacity
                        style={[styles.saveBtn, saved && styles.saveBtnSaved]}
                        onPress={toggleSave}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <BookmarkIcon filled={saved} />
                    </TouchableOpacity>
                )}
                {isListed && role === 'collection' && (
                    <View style={styles.listedBadge}>
                        <Text style={styles.listedText}>Listed</Text>
                    </View>
                )}
            </View>

            {showUpvoteButton && !isOwner && (
                <View style={styles.upvoteRow}>
                    <TouchableOpacity
                        style={styles.upvoteBtn}
                        onPress={toggleUpvote}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                        <UpvoteIcon filled={upvoted} />
                    </TouchableOpacity>
                    <Text style={[styles.upvoteCount, upvoted && styles.upvoteCountActive]}>
                        {upvoteCount}
                    </Text>
                </View>
            )}

            {/* Content - Instagram post caption style */}
            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Text style={styles.name} numberOfLines={1}>
                        {name}
                    </Text>
                    {role === 'discover' && showPrice && price > BigInt(0) && (
                        <View style={styles.priceBadge}>
                            <Text style={styles.price}>{price.toString()} DANG</Text>
                        </View>
                    )}
                </View>
                <View style={styles.ownerWrap}>
                    <PrincipalBox
                        label="Owner"
                        value={ownerStr}
                        displayValue={isOwner ? 'You' : undefined}
                        showCopyIcon
                        compact
                    />
                </View>

                <View style={styles.actions}>
                    {role === 'discover' && onBuy && !loading && (
                        <TouchableOpacity style={styles.btnPrimary} onPress={handleBuy}>
                            <Text style={styles.btnPrimaryText}>Buy Now</Text>
                        </TouchableOpacity>
                    )}

                    {role === 'collection' && !isListed && onSell && (
                        <>
                            {showSellInput ? (
                                <View style={styles.sellRow}>
                                    <TextInput
                                        style={styles.priceInput}
                                        placeholder="Price in DANG"
                                        placeholderTextColor={colors.grayText}
                                        value={sellPrice}
                                        onChangeText={setSellPrice}
                                        keyboardType="numeric"
                                    />
                                    <TouchableOpacity
                                        style={[styles.btnPrimary, styles.btnSmall]}
                                        onPress={handleSellConfirm}
                                        disabled={loading}
                                    >
                                        <Text style={styles.btnPrimaryText}>Confirm</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.btnSecondary}
                                    onPress={() => setShowSellInput(true)}
                                    disabled={loading}
                                >
                                    <Text style={styles.btnSecondaryText}>Sell</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        alignSelf: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 14,
        marginBottom: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    imageWrap: {
        position: 'relative',
        width: '100%',
        aspectRatio: 1,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(124, 58, 237, 0.08)',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imagePlaceholder: {
        backgroundColor: colors.grayMedium,
    },
    saveBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnSaved: {
        backgroundColor: 'rgba(124, 58, 237, 0.65)',
    },
    upvoteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 4,
        gap: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(124, 58, 237, 0.08)',
    },
    upvoteBtn: {
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    upvoteCount: {
        fontFamily: fonts.interSemiBold,
        fontWeight: fontWeights.interSemiBold,
        fontSize: 11,
        color: colors.grayText,
    },
    upvoteCountActive: {
        color: colors.purpleLight,
    },
    listedBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(124, 58, 237, 0.9)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    listedText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    content: {
        padding: 14,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
        gap: 12,
    },
    name: {
        fontFamily: fonts.interBold,
        fontWeight: fontWeights.interBold,
        color: colors.white,
        fontSize: 18,
        flex: 1,
    },
    priceBadge: {
        backgroundColor: 'rgba(124, 58, 237, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.4)',
    },
    price: {
        fontFamily: fonts.interSemiBold,
        fontWeight: fontWeights.interSemiBold,
        color: colors.purpleLight,
        fontSize: 14,
    },
    ownerWrap: {
        marginTop: 8,
        marginBottom: 12,
    },
    actions: {
        marginTop: 4,
    },
    btnPrimary: {
        backgroundColor: colors.purple,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    btnPrimaryText: {
        fontFamily: fonts.interSemiBold,
        fontWeight: fontWeights.interSemiBold,
        color: colors.white,
        fontSize: 15,
    },
    btnSecondary: {
        backgroundColor: 'rgba(124, 58, 237, 0.2)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    btnSecondaryText: {
        fontFamily: fonts.interSemiBold,
        fontWeight: fontWeights.interSemiBold,
        color: colors.purpleLight,
        fontSize: 15,
    },
    btnSmall: {
        paddingVertical: 10,
    },
    sellRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    priceInput: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        color: colors.white,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        fontSize: 14,
        borderWidth: 1,
        borderColor: colors.grayBorder,
    },
    loadingText: {
        color: colors.grayText,
        fontSize: 13,
    },
});
