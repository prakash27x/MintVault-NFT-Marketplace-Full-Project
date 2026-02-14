import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { CollectionScreen } from '../screens/CollectionScreen';
import { MinterScreen } from '../screens/MinterScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { LikedNFTScreen } from '../screens/LikedNFTScreen';
import { UpvotedNFTScreen } from '../screens/UpvotedNFTScreen';
import { TabBarIcon } from '../components/TabBarIcon';
import { AppHeader } from '../components/AppHeader';
import { GradientBackground } from '../components/GradientBackground';
import { colors } from '../theme/colors';
import { fonts, fontWeights } from '../theme/fonts';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
    const insets = useSafeAreaInsets();
    return (
        <View style={styles.main}>
            <GradientBackground />
            <AppHeader />
            <Tab.Navigator
                sceneContainerStyle={{ backgroundColor: 'transparent' }}
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabBarIcon name={route.name} focused={focused} />
                    ),
                    tabBarStyle: {
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'rgba(15, 15, 17, 0.95)',
                        borderTopWidth: 1,
                        borderTopColor: colors.grayBorder,
                        paddingTop: 8,
                        paddingBottom: Math.max(insets.bottom, 8),
                        height: 56 + Math.max(insets.bottom, 8),
                        elevation: 24,
                        shadowColor: colors.purple,
                        shadowOffset: { width: 0, height: -4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 12,
                    },
                    tabBarActiveTintColor: colors.purpleLight,
                    tabBarInactiveTintColor: colors.grayText,
                    tabBarLabelStyle: {
                        fontFamily: "Bebas Neue",
                        fontSize: 12,
                        letterSpacing: 1,
                    },
                    tabBarItemStyle: {
                        paddingVertical: 4,
                    },
                })}
            >
                <Tab.Screen name="Discover" component={DiscoverScreen} />
                <Tab.Screen name="Collection" component={CollectionScreen} />
                <Tab.Screen name="Mint" component={MinterScreen} />
                <Tab.Screen name="Wallet" component={WalletScreen} />
                <Tab.Screen name="Quiz" component={QuizScreen} />
            </Tab.Navigator>
        </View>
    );
};

const styles = StyleSheet.create({
    main: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});

export const AppNavigator = () => {
    const { isAuthenticated } = useAuth();

    const theme = {
        ...DarkTheme,
        colors: {
            ...DarkTheme.colors,
            primary: colors.purpleLight,
            background: 'transparent',
            card: 'transparent',
            text: colors.white,
            border: colors.grayBorder,
            notification: colors.purple,
        },
    };

    return (
        <NavigationContainer theme={theme}>
            <View style={{ flex: 1, backgroundColor: colors.black }}>
                <GradientBackground />
                <Stack.Navigator
                    key={isAuthenticated ? 'authenticated' : 'unauthenticated'}
                    screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: 'transparent' },
                    animation: 'fade',
                }}
                >
                    {isAuthenticated ? (
                        <>
                            <Stack.Screen name="Main" component={MainTabs} />
                            <Stack.Screen
                                name="Liked"
                                component={LikedNFTScreen}
                            />
                            <Stack.Screen
                                name="Upvoted"
                                component={UpvotedNFTScreen}
                            />
                        </>
                    ) : (
                        <Stack.Screen name="Login" component={LoginScreen} />
                    )}
                </Stack.Navigator>
            </View>
        </NavigationContainer>
    );
};
