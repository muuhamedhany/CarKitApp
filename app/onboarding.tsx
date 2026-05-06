import { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Pressable, ViewToken, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  FadeInRight,
  FadeInUp
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, BorderRadius, Fonts, Shadows } from '@/constants/theme';
import { GradientButton } from '@/components';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: string;
  type: 'image' | 'cards';
  title: string;
  subtitle: string;
  buttonText: string;
  image?: any;
  cards?: { iconName: string; title: string; description: string }[];
}

const slides: Slide[] = [
  {
    id: '1', type: 'image',
    title: 'Your Complete Car\nCare in One Kit',
    subtitle: 'Find authentic spare parts, trusted mechanics, and premium car services—all at transparent prices.',
    buttonText: 'Next',
    image: require('@/assets/images/onboarding/onboarding1.png'),
  },
  {
    id: '2', type: 'cards',
    title: 'All Your Car Needs,\nOne App',
    subtitle: 'Everything you need to keep your vehicle in peak performance, organized in one premium hub.', 
    buttonText: 'Continue',
    cards: [
      { iconName: 'wrench', title: 'Find Certified Service', description: 'Easily book appointments with our network of trusted mechanics.' },
      { iconName: 'cart-outline', title: 'Shop Genuine Parts', description: 'Explore a vast marketplace for OEM and quality aftermarket parts.' },
      { iconName: 'shield-check-outline', title: 'Trusted & Transparent', description: 'See reviews, ratings, and transparent pricing before you book.' },
    ],
  },
  {
    id: '3', type: 'image',
    title: 'Grow Your Business',
    subtitle: 'Join as a vendor or service provider to reach thousands of customers and grow your automotive business.',
    buttonText: 'Explore Now',
    image: require('@/assets/images/onboarding/onboarding3.png'),
  },
];

function FeatureCard({ iconName, title, description, colors, isDark }: { iconName: string; title: string; description: string; colors: any; isDark: boolean }) {
  return (
    <BlurView 
      intensity={isDark ? 20 : 40}
      tint={isDark ? 'dark' : 'light'}
      style={[cardStyles.container, { borderColor: colors.cardBorder }]}
    >
      <View style={[cardStyles.iconCircle, { backgroundColor: colors.pink + '20' }]}>
        <MaterialCommunityIcons name={iconName as any} size={24} color={colors.pink} />
      </View>
      <View style={cardStyles.textContainer}>
        <Text style={[cardStyles.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[cardStyles.description, { color: colors.textSecondary }]}>{description}</Text>
      </View>
    </BlurView>
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
          <Text style={[styles.title, { color: colors.pink }]}>{item.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
        </Animated.View>

        {item.type === 'cards' && (
          <Animated.View entering={FadeInRight.delay(600).duration(800)} style={styles.cardsContainer}>
            {item.cards?.map((card, i) => (
              <FeatureCard key={i} iconName={card.iconName} title={card.title} description={card.description} colors={colors} isDark={isDark} />
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -50, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 100, left: -100, backgroundColor: colors.purple + '10' }]} />

      <View style={styles.topNav}>
        {activeIndex < slides.length - 1 && (
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
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
          title={slides[activeIndex].buttonText}
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
    alignItems: 'flex-end',
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
