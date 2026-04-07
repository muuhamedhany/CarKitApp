import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, Spacing, BorderRadius } from '@/constants/theme';

type TabItem = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
};

const TABS: TabItem[] = [
  { name: 'index', label: 'Home', icon: 'home-outline', iconFilled: 'home' },
  { name: 'search', label: 'Search', icon: 'search-outline', iconFilled: 'search' },
  { name: 'cart', label: 'Cart', icon: 'cart-outline', iconFilled: 'cart' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', iconFilled: 'person' },
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
  const { colors } = useTheme();
  const focusProgress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    focusProgress.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isFocused]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(focusProgress.value, [0, 1], [1, 1.15]) }],
  }));

  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: focusProgress.value,
    transform: [{ scaleX: focusProgress.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
      android_ripple={{ color: 'rgba(233,30,140,0.1)', borderless: true, radius: 28 }}
    >
      <Animated.View style={iconAnimatedStyle}>
        <Ionicons
          name={isFocused ? tab.iconFilled : tab.icon}
          size={22}
          color={isFocused ? colors.pink : colors.textSecondary}
        />
      </Animated.View>
      <Text
        style={[
          styles.label,
          { color: isFocused ? colors.pink : colors.textSecondary },
          isFocused && styles.labelActive,
        ]}
      >
        {tab.label}
      </Text>
      <Animated.View
        style={[
          styles.activeIndicator,
          { backgroundColor: colors.pink },
          indicatorAnimatedStyle,
        ]}
      />
    </Pressable>
  );
}

export default function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
        {TABS.map((tab, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  container: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    width: '100%',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
  labelActive: {
    fontFamily: Fonts.bold,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    height: 3,
    borderRadius: 2,
  },
});
