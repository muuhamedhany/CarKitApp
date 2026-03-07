import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts } from '@/constants/theme';
import { useCart } from '@/contexts/CartContext';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  index: { active: 'home', inactive: 'home-outline' },
  search: { active: 'magnify', inactive: 'magnify' },
  cart: { active: 'cart', inactive: 'cart-outline' },
  profile: { active: 'account', inactive: 'account-outline' },
};

const SPRING_CONFIG = { damping: 18, stiffness: 200, mass: 0.8 };

function AnimatedTabItem({
  route, index, isFocused, options, navigation, cartCount,
}: {
  route: any; index: number; isFocused: boolean;
  options: any; navigation: any; cartCount: number;
}) {
  const scale = useSharedValue(isFocused ? 1 : 0);
  const iconSet = TAB_ICONS[route.name] || TAB_ICONS.index;
  const label = options.title ?? route.name;

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0, SPRING_CONFIG);
  }, [isFocused]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(scale.value, [0, 1], [1, 1.15], Extrapolation.CLAMP) }],
  }));

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scale.value, [0, 1], [0.5, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(scale.value, [0, 1], [0.9, 1], Extrapolation.CLAMP) }],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isFocused ? 1 : 0, { duration: 250 }),
    transform: [
      { scaleX: withSpring(isFocused ? 1 : 0, SPRING_CONFIG) },
    ],
  }));

  const iconName = isFocused ? iconSet.active : iconSet.inactive;
  const color = isFocused ? Colors.pink : 'rgba(255,255,255,0.5)';

  const onPress = () => {
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
    <Pressable
      key={route.key}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      onPress={onPress}
      style={styles.tabItem}
    >
      {/* Animated pink indicator line */}
      <Animated.View style={[styles.indicator, indicatorStyle]} />

      {/* Animated icon */}
      <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
        <MaterialCommunityIcons name={iconName as any} size={26} color={color} />
        {route.name === 'cart' && cartCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
          </View>
        )}
      </Animated.View>

      {/* Animated label */}
      <Animated.Text style={[styles.tabLabel, { color }, labelAnimatedStyle]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { cartCount } = useCart();

  return (
    <View style={styles.floatingWrapper}>
      <View style={styles.floatingBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          return (
            <AnimatedTabItem
              key={route.key}
              route={route}
              index={index}
              isFocused={isFocused}
              options={options}
              navigation={navigation}
              cartCount={cartCount}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  floatingBar: {
    flexDirection: 'row',
    backgroundColor: '#110E1F',
    borderRadius: 24,
    paddingBottom: 12,
    paddingTop: 0,
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.25)',
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 25,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.pink,
    marginBottom: 8,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -12,
    backgroundColor: Colors.pink,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontFamily: Fonts.bold,
  },
});
