import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../theme/colors';

interface GradientTextProps {
    children: string;
    style?: TextStyle;
    colors?: string[];
}

/** Gradient text matching web landing headline: white -> purpleLight -> purple */
export const GradientText: React.FC<GradientTextProps> = ({
    children,
    style,
    colors: gradientColors = [colors.white, colors.purpleLight, colors.purple],
}) => (
    <MaskedView
        maskElement={
            <Text style={[styles.mask, style]}>{children}</Text>
        }
    >
        <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
        >
            <Text style={[styles.mask, style, styles.invisible]}>{children}</Text>
        </LinearGradient>
    </MaskedView>
);

const styles = StyleSheet.create({
    mask: {
        backgroundColor: 'transparent',
    },
    invisible: {
        opacity: 0,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
