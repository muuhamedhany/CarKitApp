import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  interpolate,
  withTiming,
  FadeInDown
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, Spacing, BorderRadius, Shadows, Colors } from '@/constants/theme';

type TabItem = {
  name: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconFilled: keyof typeof MaterialCommunityIcons.glyphMap;
};

const TABS: TabItem[] = [
  { name: 'index', label: 'Home', icon: 'home-outline', iconFilled: 'home' },
  { name: 'search', label: 'Search', icon: 'magnify', iconFilled: 'magnify' },
  { name: 'cart', label: 'Cart', icon: 'cart-outline', iconFilled: 'cart' },
  { name: 'profile', label: 'Profile', icon: 'account-outline', iconFilled: 'account' },
];

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

function TabButton({
  tab,
  isFocused,
  onPress,
}: {
  tab: TabItem;
  isFocused: boolean;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const focusProgress = useSharedValue(isFocused ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    focusProgress.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: interpolate(focusProgress.value, [0, 1], [0, -4]) }
    ],
    opacity: interpolate(focusProgress.value, [0, 1], [0.6, 1]),
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(focusProgress.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(focusProgress.value, [0, 1], [0.8, 1.2]) }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tab}
    >
      <Animated.View style={[styles.glow, animatedGlowStyle, { backgroundColor: colors.pink + '20' }]} />
      
      <Animated.View style={animatedIconStyle}>
        <MaterialCommunityIcons
          name={isFocused ? tab.iconFilled : tab.icon}
          size={24}
          color={isFocused ? colors.pink : colors.textSecondary}
        />
      </Animated.View>
      
      <Text
        style={[
          styles.label,
          { 
            color: isFocused ? colors.pink : colors.textSecondary,
            fontFamily: isFocused ? Fonts.extraBold : Fonts.bold,
            opacity: isFocused ? 1 : 0.7
          },
        ]}
      >
        {tab.label}
      </Text>
      
      {isFocused && (
        <Animated.View 
          entering={FadeInDown.duration(400)}
          style={[styles.activeDot, { backgroundColor: colors.pink, shadowColor: colors.pink }]} 
        />
      )}
    </Pressable>
  );
}

export default function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <Animated.View 
      entering={FadeInDown.delay(500).duration(1000)}
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 16) }]}
    >
      <BlurView
        intensity={isDark ? 30 : 50}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.container,
          {
            backgroundColor: isDark ? 'rgba(25, 10, 40, 0.7)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          },
          Shadows.lg,
        ]}
      >
        {TABS.map((tab, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const route = state.routes[index];
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabButton
              key={tab.name}
              tab={tab}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  container: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
  },
  glow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    top: 0,
  },
  label: {
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  activeDot: {
    position: 'absolute',
    bottom: -2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
});
