import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Button, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export const HomeScreen = () => {
    const { logout, identity, isAuthenticated } = useAuth();
    const [principalId, setPrincipalId] = useState<string>('');

    useEffect(() => {
        if (identity) {
            setPrincipalId(identity.getPrincipal().toText());
        }
    }, [identity]);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome back!</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Your Principal ID:</Text>
                    <Text style={styles.value}>{principalId || 'Loading...'}</Text>
                </View>

                <View style={styles.spacer} />

                <View style={styles.actions}>
                    <Button title="Logout" onPress={logout} color="#ef4444" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        marginBottom: 30,
        marginTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    card: {
        backgroundColor: '#1f2937',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#9ca3af',
        marginBottom: 8,
    },
    value: {
        fontSize: 14,
        color: '#e5e7eb',
        fontFamily: 'Courier',
    },
    spacer: {
        height: 20,
    },
    actions: {
        marginTop: 20,
    },
});
