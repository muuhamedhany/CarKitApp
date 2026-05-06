import { useRef } from 'react';
import { 
  Pressable, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  Animated,
  Platform 
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, BorderRadius, Fonts, Animations } from '@/constants/theme';

type SecondaryButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function SecondaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
}: SecondaryButtonProps) {
  const { colors, isDark } = useTheme();
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const ButtonContent = (
    <View style={[
      styles.glassContainer, 
      { 
        backgroundColor: colors.glass,
        borderColor: colors.cardBorder,
      }
    ]}>
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} size="small" />
      ) : (
        <Text style={[styles.text, { color: colors.textPrimary }]}>{title}</Text>
      )}
    </View>
  );

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable 
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading} 
        style={[styles.wrapper, (disabled || loading) && styles.disabled]}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
            {ButtonContent}
          </BlurView>
        ) : (
          ButtonContent
        )}
      </Pressable>
    </Animated.View>
  );
}

import { View } from 'react-native';

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  blur: {
    flex: 1,
  },
  glassContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.3,
  },
});

