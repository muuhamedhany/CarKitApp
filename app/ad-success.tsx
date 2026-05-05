import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

export default function AdSuccessScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 180 }),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(slideY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();
  }, [scale, opacity, slideY]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.inner}>
        {/* Animated checkmark */}
        <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <MaterialCommunityIcons name="check" size={52} color="#fff" />
          </LinearGradient>
        </Animated.View>

        {/* Text content */}
        <Animated.View style={[styles.textBlock, { opacity, transform: [{ translateY: slideY }] }]}>
          <Text style={[styles.headline, { color: colors.textPrimary }]}>
            Ad Submitted! 🎉
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your promotion has been submitted and is now{' '}
            <Text style={{ color: colors.pink, fontFamily: Fonts.semiBold }}>
              pending admin review
            </Text>
            . Once approved, it will appear on the home screen for all customers.
          </Text>

          {/* Info card */}
          <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-outline" size={18} color={colors.pink} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Ads are reviewed within 24 hours.
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="bell-outline" size={18} color={colors.pink} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Track status in My Promotions.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.actions, { opacity, transform: [{ translateY: slideY }] }]}>
          <Pressable
            style={[styles.primaryBtn]}
            onPress={() => router.replace('/promote' as any)}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradient}
            >
              <MaterialCommunityIcons name="bullhorn-outline" size={18} color="#fff" />
              <Text style={styles.primaryText}>My Promotions</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={[styles.secondaryBtn, { borderColor: colors.cardBorder, backgroundColor: colors.backgroundSecondary }]}
            onPress={() => router.replace('/(vendor-tabs)/' as any)}
          >
            <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>
              Back to Dashboard
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },

  iconWrap: { marginBottom: Spacing.xl },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textBlock: { alignItems: 'center', marginBottom: Spacing.xl },
  headline: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.xxl,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },

  infoCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  infoText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },

  actions: { width: '100%', gap: Spacing.md },
  primaryBtn: { borderRadius: BorderRadius.full, overflow: 'hidden' },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  primaryText: { color: '#fff', fontFamily: Fonts.bold, fontSize: FontSizes.md },

  secondaryBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  secondaryText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md },
});
