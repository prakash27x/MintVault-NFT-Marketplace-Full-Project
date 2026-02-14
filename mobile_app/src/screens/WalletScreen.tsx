import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { tokenService, Transaction } from '../services/TokenService';
import { PrincipalBox } from '../components/PrincipalBox';
import { colors } from '../theme/colors';
import { fonts, fontWeights } from '../theme/fonts';

export const WalletScreen = () => {
    const { identity } = useAuth();
    const insets = useSafeAreaInsets();
    const tabBarHeight = 56 + Math.max(insets.bottom, 8);
    const [balance, setBalance] = useState<string>('');
    const [symbol, setSymbol] = useState('DANG');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [txLoading, setTxLoading] = useState(false);

    const [recipientId, setRecipientId] = useState('');
    const [amount, setAmount] = useState('');
    const [transferFeedback, setTransferFeedback] = useState('');

    const loadData = async () => {
        if (!identity) {
            setBalance('');
            setTransactions([]);
            setLoading(false);
            return;
        }
        try {
            const principal = identity.getPrincipal();
            const [bal, sym, txs] = await Promise.all([
                tokenService.balanceOf(principal, identity),
                tokenService.getSymbol(identity),
                tokenService.getTransactions(principal, identity),
            ]);
            setBalance(bal.toLocaleString());
            setSymbol(sym);
            setTransactions(
                [...txs].sort((a, b) => Number(b.timestamp - a.timestamp))
            );
        } catch (e) {
            console.error('Error loading wallet:', e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [identity])
    );

    const handleTransfer = async () => {
        if (!identity || !recipientId.trim() || !amount.trim()) return;
        const myPrincipal = identity.getPrincipal().toText();
        const recipientTrimmed = recipientId.trim();
        if (recipientTrimmed === myPrincipal) {
            setTransferFeedback('Cannot transfer to your own account');
            return;
        }
        setTxLoading(true);
        setTransferFeedback('');
        try {
            const { Principal } = await import('@dfinity/principal');
            const recipient = Principal.fromText(recipientTrimmed);
            const result = await tokenService.transfer(
                recipient,
                amount,
                identity
            );
            setTransferFeedback(result);
            if (result === 'Success') {
                setRecipientId('');
                setAmount('');
                loadData();
            }
        } catch (e) {
            setTransferFeedback(`Error: ${String(e)}`);
        } finally {
            setTxLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={[
                    styles.scroll,
                    { paddingTop: insets.top + 8, paddingBottom: tabBarHeight + 24 },
                ]}
            >
                <View style={styles.header}>
                    <Text style={styles.sectionLabel}>WALLET</Text>
                    <Text style={styles.title}>DANG Wallet</Text>
                </View>

                {!identity ? (
                    <Text style={styles.authHint}>Login to view wallet</Text>
                ) : loading ? (
                    <ActivityIndicator color={colors.purpleLight} size="large" />
                ) : (
                    <>
                        <View style={styles.balanceCard}>
                            <Text style={styles.balanceLabel}>Your Balance</Text>
                            <Text style={styles.balanceValue}>
                                {balance} {symbol}
                            </Text>
                            <View style={styles.principalWrap}>
                                <PrincipalBox
                                    label="Principal"
                                    value={identity.getPrincipal().toText()}
                                    showCopyIcon
                                />
                            </View>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Transfer</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Recipient Principal ID"
                                placeholderTextColor={colors.grayText}
                                value={recipientId}
                                onChangeText={setRecipientId}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Amount"
                                placeholderTextColor={colors.grayText}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                            />
                            <TouchableOpacity
                                style={[styles.btn, txLoading && styles.btnDisabled]}
                                onPress={handleTransfer}
                                disabled={txLoading}
                            >
                                <Text style={styles.btnText}>
                                    {txLoading ? '...' : 'Transfer'}
                                </Text>
                            </TouchableOpacity>
                            {transferFeedback ? (
                                <Text
                                    style={[
                                        styles.feedback,
                                        transferFeedback.includes('Error') && styles.feedbackError,
                                    ]}
                                >
                                    {transferFeedback}
                                </Text>
                            ) : null}
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Transaction History</Text>
                            {transactions.length === 0 ? (
                                <Text style={styles.empty}>No transactions yet</Text>
                            ) : (
                                <View style={styles.txScrollWrap}>
                                    <ScrollView
                                        style={styles.txList}
                                        contentContainerStyle={styles.txListContent}
                                        showsVerticalScrollIndicator
                                        nestedScrollEnabled
                                    >
                                        {transactions.map((tx) => {
                                            const desc = (tx.description || '').toLowerCase();
                                            const isCredit = desc.includes('credit');
                                            const isDebit = desc.includes('debit');
                                            const date = new Date(
                                                Number(tx.timestamp) / 1_000_000
                                            );
                                            return (
                                                <View
                                                    key={tx.id.toString()}
                                                    style={styles.txRow}
                                                >
                                                    <Text style={styles.txDate}>
                                                        {date.toLocaleDateString()}{' '}
                                                        {date.toLocaleTimeString()}
                                                    </Text>
                                                    <Text
                                                        style={styles.txDesc}
                                                        numberOfLines={1}
                                                    >
                                                        {tx.description}
                                                    </Text>
                                                    <Text
                                                        style={[
                                                            styles.txAmount,
                                                            isCredit && styles.txCredit,
                                                            isDebit && styles.txDebit,
                                                        ]}
                                                    >
                                                        {isCredit ? '+' : isDebit ? '−' : ''}
                                                        {tx.amount.toLocaleString()}{' '}
                                                        {symbol}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    scroll: {
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
    balanceCard: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        padding: 24,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.grayBorder,
    },
    balanceLabel: {
        color: colors.purpleLight,
        fontSize: 12,
        letterSpacing: 1,
        marginBottom: 8,
    },
    balanceValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: colors.purpleLight,
        marginBottom: 16,
    },
    principalWrap: {
        alignSelf: 'stretch',
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.grayBorder,
    },
    cardTitle: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.35)',
        color: colors.white,
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
        fontSize: 14,
        borderWidth: 1,
        borderColor: colors.grayBorder,
    },
    btn: {
        backgroundColor: colors.purple,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    btnDisabled: {
        opacity: 0.6,
    },
    btnText: {
        color: colors.white,
        fontWeight: 'bold',
    },
    feedback: {
        marginTop: 12,
        color: colors.success,
        fontSize: 14,
    },
    feedbackError: {
        color: colors.error,
    },
    empty: {
        color: colors.grayText,
        fontSize: 14,
    },
    txScrollWrap: {
        height: 280,
        marginTop: -8,
    },
    txList: {
        flex: 1,
    },
    txListContent: {
        paddingBottom: 8,
    },
    txRow: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.grayBorder,
    },
    txDate: {
        color: colors.grayText,
        fontSize: 12,
        marginBottom: 2,
    },
    txDesc: {
        color: colors.white,
        fontSize: 14,
        marginBottom: 2,
    },
    txAmount: {
        color: colors.grayText,
        fontSize: 14,
    },
    txCredit: {
        color: colors.success,
    },
    txDebit: {
        color: colors.error,
    },
});
