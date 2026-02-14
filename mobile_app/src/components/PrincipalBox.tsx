import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clipboard } from 'react-native';
import { colors } from '../theme/colors';
import { fonts, fontWeights } from '../theme/fonts';

interface PrincipalBoxProps {
    label: string;
    value: string;
    /** When set, show this in UI but still copy `value` on tap */
    displayValue?: string;
    onCopy?: () => void;
    showCopyIcon?: boolean;
    compact?: boolean;
}

export const PrincipalBox: React.FC<PrincipalBoxProps> = ({
    label,
    value,
    displayValue,
    onCopy,
    showCopyIcon = true,
    compact = false,
}) => {
    const handleCopy = () => {
        Clipboard.setString(value);
        onCopy?.();
    };

    return (
        <TouchableOpacity
            style={[styles.wrap, compact && styles.wrapCompact]}
            onPress={handleCopy}
            activeOpacity={0.8}
        >
            <View style={[styles.box, compact && styles.boxCompact]}>
                <Text style={styles.label}>{label}</Text>
                <Text
                    style={[
                        styles.value,
                        compact && styles.valueCompact,
                        displayValue === 'You' && styles.valueYou,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                >
                    {displayValue ?? value}
                </Text>
                {showCopyIcon && (
                    <View style={[styles.copyIcon, compact && styles.copyIconCompact]}>
                        <Text style={styles.copyIconText}>⎘</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    wrap: {
        alignSelf: 'stretch',
    },
    wrapCompact: {},
    box: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 10,
        paddingHorizontal: 14,
        backgroundColor: 'rgba(124, 58, 237, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.2)',
        borderRadius: 10,
    },
    boxCompact: {
        padding: 8,
        paddingHorizontal: 12,
        gap: 8,
    },
    label: {
        fontFamily: fonts.interSemiBold,
        fontWeight: fontWeights.interSemiBold,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: colors.purpleLight,
    },
    value: {
        flex: 1,
        fontFamily: fonts.inter,
        fontSize: 12,
        color: colors.white,
        marginLeft: 4,
    },
    valueCompact: {
        fontSize: 11,
    },
    valueYou: {
        color: colors.purpleLight,
        fontWeight: '900',
    },
    copyIcon: {
        padding: 4,
    },
    copyIconCompact: {
        padding: 2,
    },
    copyIconText: {
        fontSize: 14,
        color: colors.purpleLight,
        opacity: 0.8,
    },
});
