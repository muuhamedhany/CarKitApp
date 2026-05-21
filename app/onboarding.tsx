import {
  MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback,
  useRef,
  useState } from 'react';
import { Dimensions,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ViewToken,
} from 'react-native';
import Animated, {
  FadeInRight,
  FadeInUp,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';

import { GlassView, GradientButton } from '@/components';
import { BorderRadius, Fonts, FontSizes, Spacing } from '@/constants/theme';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import Text from '@/components/common/LocalizedText';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  type: 'image' | 'cards';
  titleKey: string;
  subtitleKey: string;
  buttonKey: string;
  image?: any;
  cards?: { iconName: string; titleKey: string; descriptionKey: string }[];
}

const slides: Slide[] = [
  {
    id: '1', type: 'image',
    titleKey: 'onboarding.slide1.title',
    subtitleKey: 'onboarding.slide1.subtitle',
    buttonKey: 'common.next',
    image: require('@/assets/images/onboarding/onboarding1.png'),
  },
  {
    id: '2', type: 'cards',
    titleKey: 'onboarding.slide2.title',
    subtitleKey: 'onboarding.slide2.subtitle',
    buttonKey: 'common.continue',
    cards: [
      { iconName: 'wrench', titleKey: 'onboarding.card.service.title', descriptionKey: 'onboarding.card.service.description' },
      { iconName: 'cart-outline', titleKey: 'onboarding.card.parts.title', descriptionKey: 'onboarding.card.parts.description' },
      { iconName: 'shield-check-outline', titleKey: 'onboarding.card.trust.title', descriptionKey: 'onboarding.card.trust.description' },
    ],
  },
  {
    id: '3', type: 'image',
    titleKey: 'onboarding.slide3.title',
    subtitleKey: 'onboarding.slide3.subtitle',
    buttonKey: 'onboarding.exploreNow',
    image: require('@/assets/images/onboarding/onboarding3.png'),
  },
];

function FeatureCard({ iconName, titleKey, descriptionKey, colors, isDark }: { iconName: string; titleKey: string; descriptionKey: string; colors: any; isDark: boolean }) {
  const { t, isRTL } = useTranslation();

  return (
    <GlassView
      intensity={isDark ? 20 : 40}
      tint={isDark ? 'dark' : 'light'}
      style={[cardStyles.container, { borderColor: colors.cardBorder }]}
    >
      <View style={[cardStyles.iconCircle, { backgroundColor: colors.pink + '20' }]}>
        <MaterialCommunityIcons name={iconName as any} size={24} color={colors.pink} />
      </View>
      <View style={cardStyles.textContainer}>
        <Text style={[cardStyles.title, { color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t(titleKey)}</Text>
        <Text style={[cardStyles.description, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t(descriptionKey)}</Text>
      </View>
    </GlassView>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  iconCircle: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  textContainer: { flex: 1 },
  title: { fontSize: FontSizes.md, fontFamily: Fonts.bold, marginBottom: 2 },
  description: { fontSize: 13, lineHeight: 18, fontFamily: Fonts.regular, opacity: 0.8 },
});

function PaginationDot({ index, activeIndex, colors }: { index: number; activeIndex: number; colors: any }) {
  const isActive = index === activeIndex;
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(isActive ? 32 : 8, { duration: 300 }),
    opacity: withTiming(isActive ? 1 : 0.3, { duration: 300 }),
    backgroundColor: isActive ? colors.pink : colors.textSecondary,
  }));
  return <Animated.View style={[dotStyles.dot, animatedStyle]} />;
}

const dotStyles = StyleSheet.create({
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
});

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useTranslation();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      await finishOnboarding();
    }
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await finishOnboarding();
  };

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/(auth)/login');
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={styles.slideOuter}>
      <ScrollView
        contentContainerStyle={styles.slideScroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View entering={FadeInUp.delay(200).duration(800)}>
          {item.type === 'image' ? (
            <View style={styles.imageWrapper}>
              <View style={[styles.imageGlowContainer, { shadowColor: colors.pink }]}>
                <Image
                  source={item.image}
                  style={styles.heroImage}
                  contentFit="cover"
                  transition={300}
                />
              </View>
            </View>
          ) : (
            <View style={styles.cardsHeader}>
              <View style={[styles.iconCircleLarge, { backgroundColor: colors.pink + '15' }]}>
                <MaterialCommunityIcons name="layers-triple-outline" size={48} color={colors.pink} />
              </View>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(800)}>
          <Text style={[styles.title, { color: colors.pink }]}>{t(item.titleKey)}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t(item.subtitleKey)}</Text>
        </Animated.View>

        {item.type === 'cards' && (
          <Animated.View entering={FadeInRight.delay(600).duration(800)} style={styles.cardsContainer}>
            {item.cards?.map((card, i) => (
              <FeatureCard key={i} iconName={card.iconName} titleKey={card.titleKey} descriptionKey={card.descriptionKey} colors={colors} isDark={isDark} />
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -50, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 100, left: -100, backgroundColor: colors.purple + '10' }]} />

      <View style={[styles.topNav, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
        {activeIndex < slides.length - 1 && (
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>{t('common.skip')}</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        bounces={false}
        scrollEventThrottle={16}
      />

      <View style={styles.bottomContainer}>
        <View style={styles.pagination}>
          {slides.map((_, i) => (
            <PaginationDot key={i} index={i} activeIndex={activeIndex} colors={colors} />
          ))}
        </View>

        <GradientButton
          title={slides[activeIndex].buttonKey}
          onPress={handleNext}
          style={styles.mainButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topNav: {
    height: 100,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 40,
    zIndex: 10,
  },
  skipButton: { padding: 8 },
  skipText: { fontSize: FontSizes.md, fontFamily: Fonts.semiBold, opacity: 0.6 },
  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  slideOuter: { width, flex: 1 },
  slideScroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 20,
    paddingBottom: 40
  },
  imageWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.xl + 10,
    marginTop: 20,
  },
  imageGlowContainer: {
    width: width - 80,
    aspectRatio: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  heroImage: { width: '100%', height: '100%' },
  cardsHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: 40,
  },
  iconCircleLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontFamily: Fonts.extraBoldItalic,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 44,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.sm,
    fontFamily: Fonts.medium,
    opacity: 0.7,
  },
  cardsContainer: { marginTop: Spacing.xl },
  bottomContainer: {
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  pagination: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  mainButton: { width: '100%' },
});

