import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

/**
 * Three-dot ellipsis loading animation matching web app (lds-ellipsis style)
 * Dots pulse in sequence for a rolling effect.
 */
export const EllipsisLoader: React.FC = () => {
    const prog = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.timing(prog, {
                toValue: 1,
                duration: 900,
                useNativeDriver: true,
            })
        );
        anim.start();
        return () => anim.stop();
    }, []);

    const opacity1 = prog.interpolate({
        inputRange: [0, 0.33, 0.66, 1],
        outputRange: [1, 0.3, 0.3, 1],
    });
    const opacity2 = prog.interpolate({
        inputRange: [0, 0.33, 0.66, 1],
        outputRange: [0.3, 1, 0.3, 0.3],
    });
    const opacity3 = prog.interpolate({
        inputRange: [0, 0.33, 0.66, 1],
        outputRange: [0.3, 0.3, 1, 0.3],
    });

    return (
        <View style={styles.wrap}>
            <Animated.View style={[styles.dot, { opacity: opacity1 }]} />
            <Animated.View style={[styles.dot, { opacity: opacity2 }]} />
            <Animated.View style={[styles.dot, { opacity: opacity3 }]} />
        </View>
    );
};

const DOT_SIZE = 10;

const styles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        gap: 8,
    },
    dot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: '#fff',
    },
});
