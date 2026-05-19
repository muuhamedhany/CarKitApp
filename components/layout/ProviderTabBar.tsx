import { BorderRadius, Fonts, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { DeviceEventEmitter, Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabItem = {
  name: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconFilled: keyof typeof MaterialCommunityIcons.glyphMap;
};

const TABS: TabItem[] = [
  { name: 'index', label: 'Dashboard', icon: 'view-dashboard-outline', iconFilled: 'view-dashboard' },
  { name: 'services', label: 'Services', icon: 'wrench-outline', iconFilled: 'wrench' },
  { name: 'bookings', label: 'Bookings', icon: 'calendar-check-outline', iconFilled: 'calendar-check' },
  { name: 'profile', label: 'Profile', icon: 'account-outline', iconFilled: 'account' },
];

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
  const scale = useSharedValue(1);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isFocused ? 1.15 : 1, { damping: 15, stiffness: 400 }) }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.85, { damping: 10, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 400 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tab}
      android_ripple={{ color: 'transparent' }}
    >
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
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
            fontFamily: isFocused ? Fonts.bold : Fonts.medium,
            opacity: isFocused ? 1 : 0.6
          },
        ]}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}

export default function ProviderTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const containerWidth = SCREEN_WIDTH - Spacing.xl * 2;
  const horizontalPadding = Spacing.md;
  const tabWidth = (containerWidth - horizontalPadding * 2) / TABS.length;

  const indicatorPosition = useSharedValue(state.index * tabWidth);

  useEffect(() => {
    indicatorPosition.value = withSpring(state.index * tabWidth, {
      damping: 20,
      stiffness: 350,
      mass: 0.6,
    });
  }, [indicatorPosition, state.index, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(300).duration(600)}
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 16) }]}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? colors.backgroundSecondary : '#FFFFFF',
            borderColor: colors.cardBorder,
            ...Platform.select({
              ios: {
                shadowColor: isDark ? '#000' : colors.shadowColor,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: isDark ? 0.6 : 0.12,
                shadowRadius: 20,
              },
              android: {
                elevation: 12,
                shadowColor: '#000',
              }
            })
          },
        ]}
      >
        <Animated.View
          style={[
            styles.indicator,
            {
              width: tabWidth,
              backgroundColor: colors.accentSoft,
            },
            indicatorStyle
          ]}
        />

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
            } else if (isFocused) {
              DeviceEventEmitter.emit('TAB_RELOAD', { screen: route.name });
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
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.lg,
  },
  indicator: {
    position: 'absolute',
    height: 48,
    borderRadius: BorderRadius.xl,
    left: Spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 58,
    zIndex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
