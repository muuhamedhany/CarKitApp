import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';
import { GlassView, SecondaryButton, CenteredHeader } from '@/components';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />
      
      <CenteredHeader title="Notifications" titleColor={colors.textPrimary} />

      <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.center}>
        <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.emptyIconCircle}>
          <MaterialCommunityIcons name="bell-outline" size={48} color={colors.pink} />
        </GlassView>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Notifications Yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          When you get updates about your orders or bookings, they will show up here.
        </Text>
        <View style={{ marginTop: Spacing.xxl, width: 220 }}>
          <SecondaryButton title="Go Back" onPress={() => router.back()} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.xl 
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyTitle: { 
    fontFamily: Fonts.extraBold, 
    fontSize: FontSizes.xl, 
    marginTop: Spacing.md,
    letterSpacing: -0.5
  },
  emptySubtitle: { 
    fontFamily: Fonts.medium, 
    fontSize: FontSizes.md, 
    marginTop: 10, 
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.6,
  },
});
