import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';

interface TabBarIconProps {
    name: string;
    focused: boolean;
}

const SIZE = 24;

const GradientDefs = ({ id }: { id: string }) => (
    <Defs>
        <LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.purpleLight} />
            <Stop offset="100%" stopColor={colors.purple} />
        </LinearGradient>
    </Defs>
);

const DiscoverIcon = ({ focused }: { focused: boolean }) => {
    const gid = `discover-grad`;
    const fill = focused ? `url(#${gid})` : colors.grayText;
    return (
        <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none">
            <GradientDefs id={gid} />
            <Path
                d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35"
                stroke={fill}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
};

const CollectionIcon = ({ focused }: { focused: boolean }) => {
    const gid = `collection-grad`;
    const fill = focused ? `url(#${gid})` : colors.grayText;
    return (
        <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none">
            <GradientDefs id={gid} />
            <Rect x="3" y="3" width="7" height="7" rx="1" fill={fill} />
            <Rect x="14" y="3" width="7" height="7" rx="1" fill={fill} />
            <Rect x="3" y="14" width="7" height="7" rx="1" fill={fill} />
            <Rect x="14" y="14" width="7" height="7" rx="1" fill={fill} />
        </Svg>
    );
};

const MintIcon = ({ focused }: { focused: boolean }) => {
    const gid = `mint-grad`;
    const fill = focused ? `url(#${gid})` : colors.grayText;
    return (
        <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none">
            <GradientDefs id={gid} />
            <Path
                d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z"
                fill={fill}
            />
        </Svg>
    );
};

const WalletIcon = ({ focused }: { focused: boolean }) => {
    const gid = `wallet-grad`;
    const fill = focused ? `url(#${gid})` : colors.grayText;
    return (
        <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none">
            <GradientDefs id={gid} />
            <Path
                d="M21 12V7H5a2 2 0 0 1-2-2c0-1.1.9-2 2-2h14v4"
                stroke={fill}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M3 5v14a2 2 0 0 0 2 2h16v-5"
                stroke={fill}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"
                fill={fill}
            />
        </Svg>
    );
};

const QuizIcon = ({ focused }: { focused: boolean }) => {
    const gid = `quiz-grad`;
    const fill = focused ? `url(#${gid})` : colors.grayText;
    return (
        <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none">
            <GradientDefs id={gid} />
            <Path
                d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
                stroke={fill}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M12 17h.01"
                stroke={fill}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
};

export const TabBarIcon: React.FC<TabBarIconProps> = ({ name, focused }) => {
    const renderIcon = () => {
        switch (name) {
            case 'Discover':
                return <DiscoverIcon focused={focused} />;
            case 'Collection':
                return <CollectionIcon focused={focused} />;
            case 'Mint':
                return <MintIcon focused={focused} />;
            case 'Wallet':
                return <WalletIcon focused={focused} />;
            case 'Quiz':
                return <QuizIcon focused={focused} />;
            default:
                return <DiscoverIcon focused={focused} />;
        }
    };

    return (
        <View style={[styles.container, focused && styles.containerFocused]}>
            {renderIcon()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    containerFocused: {
        backgroundColor: `${colors.purple}25`,
        borderWidth: 1,
        borderColor: `${colors.purple}40`,
    },
});
