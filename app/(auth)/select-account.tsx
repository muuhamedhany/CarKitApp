import { useTheme } from '@/hooks/useTheme';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Spacing, FontSizes, BorderRadius, Fonts, Shadows } from '@/constants/theme';
import { GlassView } from '@/components';
import { useTranslation } from '@/contexts/LanguageContext';
import { chevronForward, rowDirection, textAlign } from '@/utils/rtl';

export default function SelectAccountScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useTranslation();

  const handlePress = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(path as any);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
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
          <Text style={[styles.title, { color: colors.pink, textAlign: textAlign(isRTL) }]}>{t('auth.selectAccount.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: textAlign(isRTL) }]}>
            {t('auth.selectAccount.subtitle')}
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
              style={[styles.card, { flexDirection: rowDirection(isRTL), borderColor: colors.cardBorder }, Shadows.md]}
            >
              <View style={[styles.cardIcon, { backgroundColor: colors.pinkGlow }]}>
                <MaterialCommunityIcons name="account-outline" size={28} color={colors.pink} />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]}>{t('auth.selectAccount.customer')}</Text>
                <Text style={[styles.cardDescription, { color: colors.textSecondary, textAlign: textAlign(isRTL) }]}>
                  {t('auth.selectAccount.customerDesc')}
                </Text>
              </View>
              <MaterialCommunityIcons name={chevronForward(isRTL) as any} size={24} color={colors.textMuted} />
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
              style={[styles.card, { flexDirection: rowDirection(isRTL), borderColor: colors.cardBorder }, Shadows.md]}
            >
              <View style={[styles.cardIcon, { backgroundColor: colors.purpleGlow }]}>
                <MaterialCommunityIcons name="store-outline" size={28} color={colors.purple} />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]}>{t('auth.selectAccount.vendorProvider')}</Text>
                <Text style={[styles.cardDescription, { color: colors.textSecondary, textAlign: textAlign(isRTL) }]}>
                  {t('auth.selectAccount.vendorProviderDesc')}
                </Text>
              </View>
              <MaterialCommunityIcons name={chevronForward(isRTL) as any} size={24} color={colors.textMuted} />
            </GlassView>
          </Pressable>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(800).duration(800)}
          style={[styles.bottomLink, { flexDirection: rowDirection(isRTL) }]}
        >
          <Text style={[styles.bottomLinkText, { color: colors.textSecondary }]}>{t('auth.selectAccount.haveAccount')}</Text>
          <Pressable onPress={() => handlePress('/login')}>
            <Text style={[styles.bottomLinkAction, { color: colors.pink }]}>{t('auth.selectAccount.login')}</Text>
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
    fontSize: FontSizes.xl, 
    fontFamily: Fonts.extraBoldItalic, 
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

