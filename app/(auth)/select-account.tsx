import { useTheme } from '@/hooks/useTheme';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Spacing, FontSizes, BorderRadius, Fonts, Shadows } from '@/constants/theme';
import { GlassView } from '@/components';

const { height } = Dimensions.get('window');

export default function SelectAccountScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const handlePress = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(path as any);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '20' }]} />
      <View style={[styles.orb, { bottom: -150, left: -150, backgroundColor: colors.purple + '15' }]} />

      <View style={styles.content}>
        <Animated.View 
          entering={FadeInUp.delay(200).duration(800)}
          style={styles.header}
        >
          <Text style={[styles.title, { color: colors.pink }]}>Choose Account Type</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            How would you like to use CarKit today?
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(800)}>
          <Pressable
            style={({ pressed }) => [
              styles.cardWrapper,
              { opacity: pressed ? 0.9 : 1 }
            ]}
            onPress={() => handlePress('/signup-customer')}
          >
            <GlassView
              intensity={isDark ? 40 : 60}
              tint={isDark ? 'dark' : 'light'}
              style={[styles.card, { borderColor: colors.cardBorder }, Shadows.md]}
            >
              <View style={[styles.cardIcon, { backgroundColor: colors.pinkGlow }]}>
                <MaterialCommunityIcons name="account-outline" size={28} color={colors.pink} />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Customer</Text>
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                  Find trusted mechanics, buy parts, and track your vehicle's health.
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
            </GlassView>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(800)}>
          <Pressable
            style={({ pressed }) => [
              styles.cardWrapper,
              { opacity: pressed ? 0.9 : 1 }
            ]}
            onPress={() => handlePress('/signup-vendor')}
          >
            <GlassView
              intensity={isDark ? 40 : 60}
              tint={isDark ? 'dark' : 'light'}
              style={[styles.card, { borderColor: colors.cardBorder }, Shadows.md]}
            >
              <View style={[styles.cardIcon, { backgroundColor: colors.purpleGlow }]}>
                <MaterialCommunityIcons name="store-outline" size={28} color={colors.purple} />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Vendor / Provider</Text>
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                  Showcase your services, sell products, and manage your business.
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
            </GlassView>
          </Pressable>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(800).duration(800)}
          style={styles.bottomLink}
        >
          <Text style={[styles.bottomLinkText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <Pressable onPress={() => handlePress('/login')}>
            <Text style={[styles.bottomLinkAction, { color: colors.pink }]}>Login</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    paddingHorizontal: Spacing.lg 
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: { 
    fontSize: 36, 
    fontFamily: Fonts.extraBoldItalic, 
    lineHeight: 40,
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: FontSizes.md, 
    fontFamily: Fonts.medium, 
    opacity: 0.8 
  },
  cardWrapper: {
    marginBottom: Spacing.md,
  },
  card: {
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1, 
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  cardIcon: {
    width: 56, 
    height: 56, 
    borderRadius: 28,
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: Spacing.md,
  },
  cardText: { flex: 1 },
  cardTitle: { 
    fontSize: FontSizes.lg, 
    fontFamily: Fonts.bold, 
    marginBottom: 4 
  },
  cardDescription: { 
    fontSize: FontSizes.sm, 
    fontFamily: Fonts.medium, 
    lineHeight: 20,
    opacity: 0.7
  },
  bottomLink: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: Spacing.xl 
  },
  bottomLinkText: { 
    fontSize: FontSizes.md, 
    fontFamily: Fonts.medium 
  },
  bottomLinkAction: { 
    fontSize: FontSizes.md, 
    fontFamily: Fonts.bold 
  },
});
