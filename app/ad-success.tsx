import {
  useEffect,
  useRef } from 'react';
import { View,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { GlassView } from '@/components';
import Text from '@/components/common/LocalizedText';

export default function AdSuccessScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />

      <View style={[styles.inner, { paddingTop: insets.top }]}>
        {/* Animated checkmark */}
        <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}>
          <LinearGradient
            colors={[colors.pink, colors.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.iconCircle, Shadows.md]}
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
            <Text style={{ color: colors.pink, fontFamily: Fonts.extraBold }}>
              pending review
            </Text>
            . Once approved, it will appear on the home screen.
          </Text>

          {/* Info card */}
          <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.infoCard, { borderColor: colors.cardBorder }]}>
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
          </GlassView>
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.actions, { opacity, transform: [{ translateY: slideY }] }]}>
          <Pressable
            style={[styles.primaryBtn]}
            onPress={() => router.replace('/promote' as any)}
          >
            <LinearGradient
              colors={[colors.pink, colors.purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradient}
            >
              <MaterialCommunityIcons name="bullhorn-outline" size={20} color="#fff" />
              <Text style={styles.primaryText}>My Promotions</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/(vendor-tabs)/' as any)}
          >
            <GlassView intensity={isDark ? 10 : 30} tint={isDark ? 'dark' : 'light'} style={[styles.secondaryBtn, { borderColor: colors.cardBorder }]}>
              <Text style={[styles.secondaryText, { color: colors.textPrimary }]}>
                Back to Dashboard
              </Text>
            </GlassView>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.5 },
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
    fontSize: 32,
    textAlign: 'center',
    marginBottom: Spacing.md,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },

  infoCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    overflow: 'hidden',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  infoText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },

  actions: { width: '100%', gap: Spacing.md },
  primaryBtn: { borderRadius: BorderRadius.full, overflow: 'hidden', ...Shadows.md },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
  },
  primaryText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 16 },

  secondaryBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    overflow: 'hidden',
  },
  secondaryText: { fontFamily: Fonts.bold, fontSize: 16 },
});
