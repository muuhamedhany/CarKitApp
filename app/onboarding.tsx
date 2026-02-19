import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  ViewToken,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Spacing, FontSizes, BorderRadius, Fonts } from '@/constants/theme';

const { width } = Dimensions.get('window');

// ─── Onboarding icon components (for screen 2) ───
const ServiceIcon = () => (
  <View style={iconStyles.circle}>
    <MaterialCommunityIcons name="wrench" size={24} color={Colors.purpleLight} />
  </View>
);

const PartsIcon = () => (
  <View style={iconStyles.circle}>
    <MaterialCommunityIcons name="cart-outline" size={24} color={Colors.purpleLight} />
  </View>
);

const TrustIcon = () => (
  <View style={iconStyles.circle}>
    <MaterialCommunityIcons name="shield-check-outline" size={24} color={Colors.purpleLight} />
  </View>
);

const iconStyles = StyleSheet.create({
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    backgroundColor: 'rgba(156, 39, 176, 0.2)',
  },
});

// ─── Slide data ───
interface Slide {
  id: string;
  type: 'image' | 'cards';
  title: string;
  subtitle: string;
  buttonText: string;
  image?: any;
  cards?: { icon: () => React.JSX.Element; title: string; description: string }[];
}

const slides: Slide[] = [
  {
    id: '1',
    type: 'image',
    title: 'Your Complete Car\nCare in One Kit',
    subtitle:
      'Find authentic spare parts, trusted mechanics, and premium car services—all at transparent prices.',
    buttonText: 'Next',
    image: require('@/assets/images/onboarding/onboarding1.png'),
  },
  {
    id: '2',
    type: 'cards',
    title: 'All Your Car Needs,\nOne App',
    subtitle: '',
    buttonText: 'Continue',
    cards: [
      {
        icon: ServiceIcon,
        title: 'Find Certified Service',
        description:
          'Easily book appointments with our network of trusted mechanics.',
      },
      {
        icon: PartsIcon,
        title: 'Shop Genuine Parts',
        description:
          'Explore a vast marketplace for OEM and quality aftermarket parts.',
      },
      {
        icon: TrustIcon,
        title: 'Trusted & Transparent',
        description:
          'See reviews, ratings, and transparent pricing before you book.',
      },
    ],
  },
  {
    id: '3',
    type: 'image',
    title: 'Grow Your Business',
    subtitle:
      'Join as a vendor or service provider to reach thousands of customers and grow your automotive business',
    buttonText: 'Explore Now',
    image: require('@/assets/images/onboarding/onboarding3.png'),
  },
];

// ─── Feature Card Component ───
function FeatureCard({
  icon: IconComponent,
  title,
  description,
}: {
  icon: () => React.JSX.Element;
  title: string;
  description: string;
}) {
  return (
    <View style={cardStyles.container}>
      <IconComponent />
      <View style={cardStyles.textContainer}>
        <Text style={cardStyles.title}>{title}</Text>
        <Text style={cardStyles.description}>{description}</Text>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 20, 50, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.25)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  textContainer: { flex: 1 },
  title: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    fontFamily: Fonts.regular,
  },
});

// ─── Pagination Dot ───
function PaginationDot({
  index,
  activeIndex,
}: {
  index: number;
  activeIndex: number;
}) {
  const isActive = index === activeIndex;
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(isActive ? 28 : 10, { duration: 300 }),
    opacity: withTiming(isActive ? 1 : 0.4, { duration: 300 }),
    backgroundColor: isActive ? Colors.pink : Colors.textSecondary,
  }));

  return <Animated.View style={[dotStyles.dot, animatedStyle]} />;
}

const dotStyles = StyleSheet.create({
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
});

// ─── Main Onboarding Screen ───
export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const handleNext = async () => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      await finishOnboarding();
    }
  };

  const handleSkip = async () => {
    await finishOnboarding();
  };

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/login');
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={styles.slideOuter}>
      <ScrollView
        contentContainerStyle={styles.slideScroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {item.type === 'image' ? (
          <>
            {/* Image with glowing border only */}
            <View style={styles.imageWrapper}>
              <View style={styles.imageGlowBorder}>
                <Image
                  source={item.image}
                  style={styles.heroImage}
                  contentFit="cover"
                  transition={300}
                />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>{item.title}</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </>
        ) : (
          <>
            {/* Title for cards screen */}
            <Text style={[styles.title, { marginTop: 20 }]}>
              {item.title}
            </Text>

            {/* Feature Cards */}
            <View style={styles.cardsContainer}>
              {item.cards?.map((card, i) => (
                <FeatureCard
                  key={i}
                  icon={card.icon}
                  title={card.title}
                  description={card.description}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Skip button */}
      {activeIndex < slides.length - 1 && (
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip →</Text>
        </Pressable>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
        onScroll={(e) => {
          scrollX.value = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
      />

      {/* Bottom section: pagination + button */}
      <View style={styles.bottomContainer}>
        {/* Pagination dots */}
        <View style={styles.pagination}>
          {slides.map((_, i) => (
            <PaginationDot key={i} index={i} activeIndex={activeIndex} />
          ))}
        </View>

        {/* Action button */}
        <Pressable onPress={handleNext} style={styles.buttonWrapper}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {slides[activeIndex].buttonText}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontFamily: Fonts.semiBold,
  },
  slideOuter: {
    width,
    flex: 1,
  },
  slideScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: 80,
    paddingBottom: Spacing.md,
  },
  // ─── Image with glowing border only ───
  imageWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  imageGlowBorder: {
    width: width - 64,
    aspectRatio: 1.2,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(233, 30, 140, 0.6)',
    // Glow effect via shadow
    shadowColor: '#E91E8C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: Colors.pink,
    fontSize: 32,
    fontFamily: Fonts.extraBoldItalic,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 42,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.sm,
    fontFamily: Fonts.regular,
  },
  cardsContainer: {
    marginTop: Spacing.lg,
  },
  bottomContainer: {
    paddingBottom: 40,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  buttonWrapper: {
    width: '100%',
  },
  button: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bold,
  },
});
