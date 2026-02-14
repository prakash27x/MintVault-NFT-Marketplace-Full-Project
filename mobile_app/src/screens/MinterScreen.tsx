import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { openDService } from '../services/OpenDService';
import { QUIZ_API_URL } from '../config/canisters';
import { colors } from '../theme/colors';
import { fonts, fontWeights } from '../theme/fonts';

interface OriginalityLayer {
    passed: boolean | null;
    name: string;
    message?: string;
    scorePercent?: number | null;
}

interface OriginalityResult {
    approved: boolean | null;
    reason?: string;
    message?: string;
    layers?: { layer1?: OriginalityLayer; layer2?: OriginalityLayer; layer3?: OriginalityLayer };
    originalityScore?: number | string;
    similarityScore?: number | string;
    existingNft?: { name?: string; nft_principal_id?: string };
    mostSimilarNft?: { name?: string; nft_principal_id?: string };
}

export const MinterScreen = () => {
    const { identity } = useAuth();
    const insets = useSafeAreaInsets();
    const tabBarHeight = 56 + Math.max(insets.bottom, 8);
    const [name, setName] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imageType, setImageType] = useState<string>('image/jpeg');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mintedId, setMintedId] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [originalityChecking, setOriginalityChecking] = useState(false);
    const [originalityCheckResult, setOriginalityCheckResult] = useState<OriginalityResult | null>(null);
    const [originalityLiveLayers, setOriginalityLiveLayers] = useState<{
        stage: number;
        layers: OriginalityResult['layers'] | null;
        checking: boolean;
    } | null>(null);

    const pickImage = async () => {
        try {
            const { launchImageLibrary } = await import('react-native-image-picker');
            const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.9,
                includeBase64: true,
            });
            if (result.didCancel) return;
            if (result.errorCode) {
                setError(result.errorMessage || 'Failed to pick image');
                return;
            }
            const asset = result.assets?.[0];
            if (asset?.uri && asset.base64) {
                setImageUri(asset.uri);
                setImageBase64(asset.base64);
                setImageType(asset.type || 'image/jpeg');
                setOriginalityCheckResult(null);
                setError('');
            } else if (asset?.uri) {
                setImageUri(asset.uri);
                setImageBase64(null);
                setImageType(asset.type || 'image/jpeg');
                setOriginalityCheckResult(null);
                setError('');
            }
        } catch (e) {
            setError('Image picker not available. Install react-native-image-picker.');
        }
    };

    const checkOriginality = async (): Promise<OriginalityResult | null> => {
        if (!identity || !imageUri || !name.trim()) return null;

        const appendForm = (stage: number) => {
            const fd = new FormData();
            // React Native FormData requires { uri, name, type } - Blob from Uint8Array is not supported
            fd.append('image', {
                uri: imageUri!,
                name: `image.${imageType?.includes('png') ? 'png' : 'jpg'}`,
                type: imageType || 'image/jpeg',
            });
            fd.append('principalId', identity.getPrincipal().toText());
            fd.append('name', name.trim());
            fd.append('stage', String(stage));
            return fd;
        };

        const fetchStage = async (stage: number) => {
            const res = await fetch(`${QUIZ_API_URL}/api/nft/check-originality`, {
                method: 'POST',
                body: appendForm(stage),
            });
            if (!res.ok) throw new Error(`Stage ${stage} failed: ${res.statusText}`);
            return res.json();
        };

        try {
            setOriginalityChecking(true);
            setOriginalityCheckResult(null);
            setOriginalityLiveLayers(null);

            setOriginalityLiveLayers({ stage: 1, layers: null, checking: true });
            const r1 = await fetchStage(1);
            setOriginalityLiveLayers({ stage: 1, layers: r1.layers, checking: false });
            if (r1.approved === false) {
                setOriginalityLiveLayers(null);
                setOriginalityCheckResult(r1);
                return r1;
            }

            setOriginalityLiveLayers({ stage: 2, layers: r1.layers, checking: true });
            const r2 = await fetchStage(2);
            setOriginalityLiveLayers({ stage: 2, layers: r2.layers, checking: false });

            setOriginalityLiveLayers({ stage: 3, layers: r2.layers, checking: true });
            const r3 = await fetchStage(3);
            setOriginalityLiveLayers(null);
            setOriginalityCheckResult(r3);
            return r3;
        } catch (e) {
            console.error('Originality check error:', e);
            setOriginalityLiveLayers(null);
            setOriginalityCheckResult({
                approved: null,
                reason: 'error',
                message: 'Originality check unavailable. Proceeding with mint.',
            });
            return null;
        } finally {
            setOriginalityChecking(false);
        }
    };

    const storeNFTMetadata = async (
        nftPrincipalId: string,
        nftName: string,
        imageByteData: number[],
        checkResult: OriginalityResult | null
    ) => {
        if (!identity) return;
        try {
            const uint8Array = new Uint8Array(imageByteData);
            const binary = Array.from(uint8Array)
                .map((b) => String.fromCharCode(b))
                .join('');
            const imageBase64Data = btoa(binary);
            const res = await fetch(`${QUIZ_API_URL}/api/nft/store-metadata`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nftPrincipalId,
                    mintedByPrincipal: identity.getPrincipal().toText(),
                    name: nftName,
                    imageData: imageBase64Data,
                    imageHash: (checkResult as Record<string, unknown>)?.imageHash || null,
                    phash: (checkResult as Record<string, unknown>)?.phash || null,
                    embedding: (checkResult as Record<string, unknown>)?.embedding || null,
                    embedding_model: (checkResult as Record<string, unknown>)?.embedding_model || 'simple',
                    originalityScore: checkResult?.originalityScore ?? null,
                    similarityScore: checkResult?.similarityScore ?? null,
                    mostSimilarNftPrincipalId: checkResult?.mostSimilarNft?.nft_principal_id || null,
                }),
            });
            if (!res.ok) console.warn('Failed to store NFT metadata');
        } catch (e) {
            console.warn('Metadata storage failed:', e);
        }
    };

    const mint = async () => {
        if (!identity || !name.trim()) {
            setError('Please enter a name and select an image');
            return;
        }
        if (!imageUri) {
            setError('Please select an image');
            return;
        }

        setLoading(true);
        setError('');
        setOriginalityCheckResult(null);

        try {
            let byteData: number[];
            if (imageBase64) {
                const binary = atob(imageBase64);
                byteData = Array.from(binary, (c) => c.charCodeAt(0));
            } else if (imageUri) {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                const arrayBuffer = await blob.arrayBuffer();
                byteData = [...new Uint8Array(arrayBuffer)];
            } else {
                throw new Error('No image data');
            }

            let originalityResult: OriginalityResult | null = null;
            try {
                originalityResult = await checkOriginality();
                if (originalityResult?.approved === false) {
                    setLoading(false);
                    setError(originalityResult.message || 'Duplicate or derivative detected. Minting blocked.');
                    return;
                }
            } catch (e) {
                console.warn('Originality check failed, proceeding with mint:', e);
            }

            const opendActor = await openDService.getOpenDActor(identity);
            const newId = await opendActor.mint(byteData, name.trim());

            if (newId.toText() === 'aaaaa-aa') {
                throw new Error('Minting failed: Insufficient cycles. Top up the canister.');
            }

            storeNFTMetadata(newId.toText(), name.trim(), byteData, originalityResult).catch(() => {});

            setMintedId(newId.toText());
        } catch (e: unknown) {
            setError(String(e));
        } finally {
            setLoading(false);
        }
    };

    if (mintedId) {
        return (
            <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
                <View style={styles.success}>
                    <Text style={styles.successTitle}>NFT Minted!</Text>
                    <Text style={styles.successId}>{mintedId}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={[
                    styles.formScroll,
                    {
                        paddingTop: insets.top + 8,
                        paddingBottom: tabBarHeight + 24,
                    },
                ]}
                showsVerticalScrollIndicator={false}
            >
            <View style={styles.header}>
                <Text style={styles.sectionLabel}>MINTER</Text>
                <Text style={styles.title}>Mint NFT</Text>
            </View>

            {!identity ? (
                <Text style={styles.authHint}>Please login to mint NFTs</Text>
            ) : (
                <View style={styles.formWrapper}>
                <View style={styles.form}>
                    <Text style={styles.label}>Collection Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. CryptoDunks"
                        placeholderTextColor={colors.grayText}
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.label}>Image</Text>
                    {imageUri && (
                        <View style={styles.previewWrap}>
                            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                        </View>
                    )}
                    <TouchableOpacity style={styles.pickBtn} onPress={pickImage}>
                        <Text style={styles.pickBtnText}>
                            {imageUri ? 'Change Image' : 'Pick Image'}
                        </Text>
                    </TouchableOpacity>

                    {(originalityChecking || originalityLiveLayers) && (
                        <View style={styles.originalityBanner}>
                            <ActivityIndicator size="small" color={colors.purpleLight} />
                            <Text style={styles.originalityBannerText}>
                                {originalityLiveLayers
                                    ? `Verifying Layer ${originalityLiveLayers.stage}...`
                                    : 'Checking originality...'}
                            </Text>
                        </View>
                    )}

                    {(originalityLiveLayers?.layers || originalityCheckResult?.layers) && (
                        <View style={styles.layersCard}>
                            <Text style={styles.layersTitle}>Originality verification</Text>
                            {originalityCheckResult?.approved === true && (
                                <Text style={styles.layersPassed}>✓ Passed</Text>
                            )}
                            {originalityCheckResult?.approved === false && (
                                <Text style={styles.layersFailed}>✕ Failed - Minting blocked</Text>
                            )}
                            {[1, 2, 3].map((i) => {
                                const layers = originalityLiveLayers?.layers || originalityCheckResult?.layers;
                                const layer = layers?.[`layer${i}` as 'layer1' | 'layer2' | 'layer3'] as OriginalityLayer | undefined;
                                if (!layer) return null;
                                const status = layer.passed === true ? '✓' : layer.passed === false ? '✕' : originalityLiveLayers?.stage === i && originalityLiveLayers?.checking ? '...' : '—';
                                return (
                                    <View key={i} style={styles.layerRow}>
                                        <Text style={styles.layerName}>L{i}: {layer.name}</Text>
                                        <Text style={[styles.layerStatus, layer.passed === false && styles.layerFailed]}>
                                            {status}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {originalityCheckResult?.reason === 'error' && (
                        <Text style={styles.originalityInfo}>ℹ️ {originalityCheckResult.message}</Text>
                    )}

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.mintBtn, loading && styles.mintBtnDisabled]}
                        onPress={mint}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.white} />
                        ) : (
                            <Text style={styles.mintBtnText}>Mint NFT</Text>
                        )}
                    </TouchableOpacity>
                </View>
                </View>
            )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingHorizontal: 20,
    },
    header: {
        marginBottom: 24,
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
    authHint: {
        color: colors.grayText,
        fontSize: 16,
    },
    formScroll: {
        paddingHorizontal: 0,
    },
    formWrapper: {
        paddingBottom: 20,
    },
    form: {
        gap: 16,
    },
    originalityBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    originalityBannerText: {
        color: '#a78bfa',
        fontSize: 14,
    },
    originalityInfo: {
        color: colors.grayText,
        fontSize: 14,
    },
    layersCard: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.grayBorder,
    },
    layersTitle: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    layersPassed: {
        color: colors.success,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    layersFailed: {
        color: colors.error,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    layerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
    },
    layerName: {
        color: colors.grayText,
        fontSize: 13,
    },
    layerStatus: {
        color: colors.success,
        fontSize: 14,
    },
    layerFailed: {
        color: colors.error,
    },
    label: {
        color: colors.grayText,
        fontSize: 14,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.35)',
        color: colors.white,
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.grayBorder,
    },
    previewWrap: {
        marginBottom: 12,
        alignItems: 'center',
    },
    imagePreview: {
        width: 140,
        height: 140,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.grayBorder,
    },
    pickBtn: {
        backgroundColor: 'rgba(124, 58, 237, 0.2)',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.4)',
    },
    pickBtnText: {
        color: colors.purpleLight,
        fontWeight: '600',
    },
    error: {
        color: colors.error,
        fontSize: 14,
    },
    mintBtn: {
        backgroundColor: colors.purple,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    mintBtnDisabled: {
        opacity: 0.6,
    },
    mintBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    success: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.success,
        marginBottom: 12,
    },
    successId: {
        color: colors.grayText,
        fontSize: 12,
    },
});
