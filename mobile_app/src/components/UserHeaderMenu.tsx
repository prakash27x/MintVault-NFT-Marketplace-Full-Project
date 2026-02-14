import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { PrincipalBox } from './PrincipalBox';
import { colors } from '../theme/colors';
import { fonts, fontWeights } from '../theme/fonts';

const UserIcon = () => (
    <View style={styles.userIconWrap}>
        <View style={styles.userHead} />
        <View style={styles.userBody} />
    </View>
);

export const UserHeaderMenu: React.FC = () => {
    const { identity, logout } = useAuth();
    const navigation = useNavigation();
    const [menuOpen, setMenuOpen] = useState(false);
    const insets = useSafeAreaInsets();
    const principal = identity?.getPrincipal();
    const principalStr = principal?.toText() ?? '';

    if (!identity || !principalStr) return null;

    return (
        <>
            <TouchableOpacity
                onPress={() => setMenuOpen(true)}
                style={styles.userBtn}
                activeOpacity={0.8}
            >
                <UserIcon />
            </TouchableOpacity>

            <Modal
                visible={menuOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuOpen(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setMenuOpen(false)}
                >
                    <Pressable
                        style={[
                            styles.dropdown,
                            { top: insets.top + 52, right: 20 },
                        ]}
                        onPress={() => {}}
                    >
                        <View style={styles.dropdownSection}>
                            <PrincipalBox
                                label="Principal"
                                value={principalStr}
                                showCopyIcon
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.likedBtn}
                            onPress={() => {
                                setMenuOpen(false);
                                navigation.navigate('Liked' as never);
                            }}
                        >
                            <Text style={styles.likedText}>Saved NFTs</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.likedBtn}
                            onPress={() => {
                                setMenuOpen(false);
                                navigation.navigate('Upvoted' as never);
                            }}
                        >
                            <Text style={styles.likedText}>Upvoted NFTs</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.logoutBtn}
                            onPress={() => {
                                setMenuOpen(false);
                                logout();
                            }}
                        >
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    userBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(124, 58, 237, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userIconWrap: {
        width: 22,
        height: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userHead: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.purpleLight,
        marginBottom: 2,
    },
    userBody: {
        width: 10,
        height: 6,
        borderBottomLeftRadius: 5,
        borderBottomRightRadius: 5,
        backgroundColor: colors.purpleLight,
        opacity: 0.9,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    dropdown: {
        position: 'absolute',
        minWidth: 280,
        maxWidth: 360,
        backgroundColor: 'rgba(15, 15, 17, 0.98)',
        borderWidth: 1,
        borderColor: colors.grayBorder,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
        elevation: 24,
    },
    dropdownSection: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.grayBorder,
    },
    likedBtn: {
        padding: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.grayBorder,
    },
    likedText: {
        fontFamily: "Bebas Neue",
        fontWeight: fontWeights.interSemiBold,
        fontSize: 18,
        letterSpacing: 0.5,
        color: colors.purpleLight,
    },
    logoutBtn: {
        padding: 14,
        paddingHorizontal: 16,
    },
    logoutText: {
        fontFamily: "Bebas Neue",
        fontSize: 16,
        color: colors.error,
        letterSpacing: 0.5,
    },
});
