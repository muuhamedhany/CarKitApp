import { GlassView } from '@/components';
import { BorderRadius, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ad } from '@/services/api/ad.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Extrapolate,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AD_SLIDE_INTERVAL = 5000;

interface AdSlideshowProps {
  ads: Ad[];
  onAdPress?: (ad: Ad) => void;
}

export function AdSlideshow({ ads, onAdPress }: AdSlideshowProps) {
  const { colors, isDark } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const adWidth = SCREEN_WIDTH - Spacing.lg * 2;

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % ads.length;
      scrollRef.current?.scrollTo({ x: indexRef.current * adWidth, animated: true });
      setActiveIndex(indexRef.current);
    }, AD_SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [ads.length, adWidth]);

  if (ads.length === 0) return null;

  return (
    <View style={adStyles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          scrollX.value = e.nativeEvent.contentOffset.x;
        }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / adWidth);
          indexRef.current = idx;
          setActiveIndex(idx);
        }}
      >
        {ads.map((ad, index) => (
          <AdSlide
            key={ad.ad_id}
            ad={ad}
            width={adWidth}
            colors={colors}
            isDark={isDark}
            onPress={() => onAdPress?.(ad)}
          />
        ))}
      </ScrollView>

      {ads.length > 1 && (
        <View style={adStyles.dotsRow}>
          {ads.map((_, i) => (
            <Dot key={i} index={i} scrollX={scrollX} width={adWidth} activeColor={colors.pink} />
          ))}
        </View>
      )}
    </View>
  );
}

function AdSlide({ ad, width, colors, isDark, onPress }: { ad: Ad; width: number; colors: any; isDark: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={[adStyles.slideContainer, { width }, animatedStyle]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={adStyles.slide}
      >
        {ad.banner_image_url ? (
          <Image source={{ uri: ad.banner_image_url }} style={adStyles.slideImage} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[colors.purple, colors.pink]}
            style={adStyles.slideImage}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="bullhorn" size={42} color="#fff" style={{ opacity: 0.9 }} />
          </LinearGradient>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.32)']}
          style={adStyles.slideOverlay}
        />

        <View style={adStyles.adBadgeWrapper}>
          <GlassView intensity={20} tint="dark" style={adStyles.adBadgeBlur}>
            <Text style={adStyles.adBadgeText}>Ad</Text>
          </GlassView>
        </View>

      </Pressable>
    </Animated.View>
  );
}

function Dot({ index, scrollX, width, activeColor }: { index: number; scrollX: SharedValue<number>; width: number; activeColor: string }) {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0.3, 1, 0.3],
      Extrapolate.CLAMP
    );
    const dotWidth = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [6, 20, 6],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      width: dotWidth,
      backgroundColor: activeColor,
    };
  });

  return <Animated.View style={[adStyles.dot, animatedStyle]} />;
}

const adStyles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.md },
  slideContainer: {
    paddingHorizontal: 0,
    height: 200,
  },
  slide: {
    flex: 1,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
  },
  slideImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  adBadgeWrapper: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  adBadgeBlur: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  adBadgeText: {
    color: '#fff',
    fontFamily: Fonts.extraBold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  slideContent: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: -20,
    marginBottom: 20,
  },
  dot: { height: 6, borderRadius: 3 },
});
