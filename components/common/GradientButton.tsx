import { useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  Animated,
  Platform,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, FontSizes, BorderRadius, Fonts, Shadows, Animations } from '@/constants/theme';

type GradientButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'pink' | 'purple';
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconSize?: number;
};

export default function GradientButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  variant = 'pink',
  icon,
  iconSize = 20,
}: GradientButtonProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 40,
    }).start();
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  return (
    <Animated.View style={[
      { transform: [{ scale: scaleAnim }] },
      { borderRadius: BorderRadius.full }, // Ensure shadow matches button shape on Android
      style
    ]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={styles.wrapper}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.gradient, (disabled || loading) && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.content}>
              {icon && <MaterialCommunityIcons name={icon} size={iconSize} color="#FFFFFF" style={styles.icon} />}
              <Text style={styles.text}>{title}</Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#FFFFFF',
    fontSize: FontSizes.md,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: Spacing.sm,
  },
});

