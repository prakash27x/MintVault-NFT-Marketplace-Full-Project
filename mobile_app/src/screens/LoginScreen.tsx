import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { GradientText } from '../components/GradientText';
import { colors } from '../theme/colors';
import { fonts, fontWeights } from '../theme/fonts';

export const LoginScreen = () => {
    const { login, authReady, authClient } = useAuth();
    const insets = useSafeAreaInsets();
    const canLogin = authReady && authClient;

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
                <GradientText
                    style={styles.label}
                    colors={[colors.purpleLight, colors.purple]}
                >
                    Decentralized NFT Marketplace
                </GradientText>
                <GradientText style={styles.title}>MINTVAULT</GradientText>
                <GradientText
                    style={styles.subtitle}
                    colors={[colors.purpleLight, colors.purple]}
                >
                    Verified Original NFTs on the Internet Computer
                </GradientText>
                <Text style={styles.desc}>
                    Mint, buy, and sell digital collectibles with AI-powered originality
                    checks.
                </Text>

                <View style={styles.spacer} />

                {!authReady ? (
                    <ActivityIndicator size="large" color={colors.purpleLight} style={styles.loader} />
                ) : (
                    <TouchableOpacity
                        style={[styles.button, !canLogin && styles.buttonDisabled]}
                        onPress={login}
                        disabled={!canLogin}
                    >
                        <Text style={styles.buttonText}>
                            {canLogin ? 'Login with Internet Identity' : 'Initializing...'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    label: {
        fontFamily: "Bebas Neue",
        fontSize: 16,
        letterSpacing: 4,
        marginBottom: 16,
        textTransform: 'uppercase',
    },
    title: {
        fontFamily: "Bebas Neue",
        fontSize: 64,
        letterSpacing: 4,
        marginBottom: 45,
        marginTop: 20,
        lineHeight: 64,
    },
    subtitle: {
        fontFamily: "Bebas Neue",
        fontSize: 18,
        letterSpacing: 2,
        marginBottom: 20,
        textAlign: 'center',
    },
    desc: {
        fontFamily: "Bebas Neue",
        fontWeight: fontWeights.inter,
        fontSize: 14,
        color: colors.grayText,
        textAlign: 'center',
        lineHeight: 24,
        letterSpacing: 1.5,
        marginBottom: 36,
        marginTop: 24
    },
    spacer: {
        height: 48,
    },
    button: {
        backgroundColor: '#transparent',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.purpleLight,
    },
    buttonText: {
        fontFamily: "Bebas Neue",
        fontWeight: fontWeights.interSemiBold,
        color: colors.purpleLight,
        letterSpacing: 2,
        fontSize: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    loader: {
        marginVertical: 24,
    },
});
