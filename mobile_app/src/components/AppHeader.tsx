import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { UserHeaderMenu } from './UserHeaderMenu';
import { colors } from '../theme/colors';
import { fonts, fontWeights } from '../theme/fonts';

export const AppHeader: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const goToDiscover = () => {
        navigation.navigate('Main' as never, { screen: 'Discover' } as never);
    };

    return (
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity onPress={goToDiscover} activeOpacity={0.8}>
                <Text style={styles.headerTitle}>MV</Text>
            </TouchableOpacity>
            <UserHeaderMenu />
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 10,
        backgroundColor: 'transparent',
        zIndex: 10,
    },
    headerTitle: {
        fontFamily: "Bebas Neue",
        fontSize: 32,
        letterSpacing: 1,
        color: colors.purpleLight,
    },
});
