import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Linking,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { tokenService } from '../services/TokenService';
import { QUIZ_API_URL } from '../config/canisters';
import { colors } from '../theme/colors';
import { fonts, fontWeights } from '../theme/fonts';

export const QuizScreen = () => {
    const { identity } = useAuth();
    const insets = useSafeAreaInsets();
    const tabBarHeight = 56 + Math.max(insets.bottom, 8);
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchPoints = async () => {
        if (!identity) {
            setPoints(0);
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(
                `${QUIZ_API_URL}/api/quiz/points?principalId=${encodeURIComponent(identity.getPrincipal().toText())}`,
                { method: 'GET', headers: { 'Content-Type': 'application/json' } }
            );
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || `HTTP ${res.status}`);
            }
            const data = await res.json();
            setPoints(data.points || 0);
        } catch (e) {
            setError(`Failed to load points. Ensure quiz service runs at ${QUIZ_API_URL}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoints();
        const interval = setInterval(fetchPoints, 10000);
        return () => clearInterval(interval);
    }, [identity]);

    const handleClaim = async () => {
        if (!identity || points === 0) return;
        setClaiming(true);
        setError('');
        setSuccess('');
        try {
            const result = await tokenService.rewardQuiz(BigInt(points), identity);
            if (result !== 'Success') throw new Error(result);

            const resetRes = await fetch(`${QUIZ_API_URL}/api/quiz/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    principalId: identity.getPrincipal().toText(),
                    amount: points,
                }),
            });
            if (!resetRes.ok) throw new Error('Failed to reset points');

            setSuccess(`Claimed ${points} DANG tokens!`);
            setPoints(0);
        } catch (e) {
            setError(`Failed to claim: ${String(e)}`);
        } finally {
            setClaiming(false);
        }
    };

    const handleStartQuiz = () => {
        if (!identity) {
            setError('Please login to start quiz');
            return;
        }
        const url = `${QUIZ_API_URL}/quiz/ic?principalId=${encodeURIComponent(identity.getPrincipal().toText())}&returnTo=mobile`;
        Linking.openURL(url).catch(() => setError('Could not open quiz'));
        setTimeout(fetchPoints, 30000);
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{
                paddingTop: insets.top + 8,
                paddingBottom: tabBarHeight + 24,
                paddingHorizontal: 20,
            }}
        >
            <View style={styles.header}>
                <Text style={styles.sectionLabel}>QUIZ</Text>
                <Text style={styles.title}>Quiz Rewards</Text>
            </View>

            <Text style={styles.subtitle}>Earn DANG by completing quizzes</Text>

            {!identity ? (
                <Text style={styles.authHint}>Please login to access quiz rewards.</Text>
            ) : (
                <View style={styles.content}>
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Your Quiz Points</Text>
                        {loading ? (
                            <ActivityIndicator color={colors.purpleLight} />
                        ) : (
                            <Text style={styles.points}>{points}</Text>
                        )}
                        <Text style={styles.hint}>1 point = 1 DANG token</Text>
                    </View>

                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    {success ? <Text style={styles.success}>{success}</Text> : null}

                    <TouchableOpacity style={styles.btn} onPress={handleStartQuiz}>
                        <Text style={styles.btnText}>Start Quiz</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btn, styles.btnSecondary]}
                        onPress={handleClaim}
                        disabled={points === 0 || claiming}
                    >
                        <Text style={styles.btnText}>
                            {claiming ? 'Claiming...' : `Claim ${points} Tokens`}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.btnGhost}
                        onPress={fetchPoints}
                        disabled={loading}
                    >
                        <Text style={styles.btnGhostText}>Refresh</Text>
                    </TouchableOpacity>

                    <View style={styles.info}>
                        <Text style={styles.infoTitle}>How it works</Text>
                        <Text style={styles.infoText}>
                            1. Start Quiz opens the quiz in your browser{'\n'}
                            2. Answer questions to earn points{'\n'}
                            3. Return and Claim Tokens to get DANG{'\n'}
                            4. Use DANG to buy NFTs!
                        </Text>
                    </View>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        marginBottom: 8,
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
    subtitle: {
        color: colors.grayText,
        fontSize: 16,
        marginBottom: 24,
    },
    authHint: {
        color: colors.grayText,
        fontSize: 16,
    },
    content: {
        gap: 16,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.grayBorder,
    },
    cardLabel: {
        color: colors.purpleLight,
        fontSize: 12,
        letterSpacing: 1,
        marginBottom: 8,
    },
    points: {
        fontSize: 48,
        fontWeight: 'bold',
        color: colors.purpleLight,
        marginBottom: 4,
    },
    hint: {
        color: colors.grayText,
        fontSize: 12,
    },
    error: {
        color: colors.error,
        fontSize: 14,
    },
    success: {
        color: colors.success,
        fontSize: 14,
    },
    btn: {
        backgroundColor: colors.purple,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    btnSecondary: {
        backgroundColor: 'rgba(124, 58, 237, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.4)',
    },
    btnText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    btnGhost: {
        padding: 12,
        alignItems: 'center',
    },
    btnGhostText: {
        color: colors.grayText,
        fontSize: 14,
    },
    info: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 20,
        borderRadius: 12,
        marginTop: 16,
        borderWidth: 1,
        borderColor: colors.grayBorder,
    },
    infoTitle: {
        color: colors.white,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    infoText: {
        color: colors.grayText,
        fontSize: 14,
        lineHeight: 22,
    },
});
