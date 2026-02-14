import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export const GradientBackground = () => {
    const float1 = useRef(new Animated.Value(0)).current;
    const float2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const anim1 = Animated.loop(
            Animated.sequence([
                Animated.timing(float1, {
                    toValue: 1,
                    duration: 3500,
                    useNativeDriver: true,
                }),
                Animated.timing(float1, {
                    toValue: 0,
                    duration: 3500,
                    useNativeDriver: true,
                }),
            ]),
            { resetBeforeIteration: false }
        );
        const anim2 = Animated.loop(
            Animated.sequence([
                Animated.timing(float2, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(float2, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ]),
            { resetBeforeIteration: false }
        );
        anim1.start();
        anim2.start();
        return () => {
            anim1.stop();
            anim2.stop();
        };
    }, [float1, float2]);

    const translateY1 = float1.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -25],
    });
    const translateY2 = float2.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 20],
    });

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={styles.radialOverlay} />
            <Animated.View
                style={[
                    styles.blob1,
                    { transform: [{ translateY: translateY1 }] },
                ]}
            />
            <Animated.View
                style={[
                    styles.blob2,
                    { transform: [{ translateY: translateY2 }] },
                ]}
            />
            {/* Floating particles */}
            <View style={[styles.particle, styles.p1]} />
            <View style={[styles.particle, styles.p2]} />
            <View style={[styles.particle, styles.p3]} />
            <View style={[styles.particle, styles.p4]} />
        </View>
    );
};

const styles = StyleSheet.create({
    radialOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.black,
    },
    blob1: {
        position: 'absolute',
        bottom: -height * 0.1,
        right: -width * 0.05,
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: `${colors.purple}40`,
        opacity: 0.5,
    },
    blob2: {
        position: 'absolute',
        top: -height * 0.05,
        left: -width * 0.1,
        width: width * 0.6,
        height: width * 0.6,
        borderRadius: width * 0.3,
        backgroundColor: `${colors.purpleAccent}30`,
        opacity: 0.5,
    },
    particle: {
        position: 'absolute',
        borderRadius: 100,
        backgroundColor: colors.purpleLight,
        opacity: 0.3,
    },
    p1: { top: '18%', left: '12%', width: 6, height: 6 },
    p2: { top: '38%', right: 18, width: 10, height: 10, opacity: 0.25 },
    p3: { bottom: '35%', left: '22%', width: 8, height: 8, opacity: 0.35 },
    p4: { top: '55%', right: '28%', width: 6, height: 6, opacity: 0.2 },
});
