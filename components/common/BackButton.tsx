import React from 'react';
import { Pressable, StyleSheet, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';

type BackButtonProps = {
  onPress?: () => void;
};

export default function BackButton({ onPress }: BackButtonProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { top: Platform.OS === 'ios' ? insets.top : insets.top + 10 }]}>
      <Pressable
        onPress={onPress || (() => router.back())}
        style={[
          styles.button,
          {
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.backgroundSecondary,
            borderColor: colors.cardBorder,
          },
        ]}
        hitSlop={8}
      >
        {Platform.OS === 'ios' && (
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 50,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
