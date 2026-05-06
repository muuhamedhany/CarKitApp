import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
  SharedValue
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Ad } from '@/services/api/ad.service';

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
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={adStyles.slideOverlay}
        />

        <View style={adStyles.adBadgeWrapper}>
          <BlurView intensity={20} tint="dark" style={adStyles.adBadgeBlur}>
             <Text style={adStyles.adBadgeText}>PROMOTED</Text>
          </BlurView>
        </View>

        <View style={adStyles.slideContent}>
           <Text style={adStyles.advertiserName}>{ad.advertiser_name || 'Featured Vendor'}</Text>
           <View style={[adStyles.exploreBadge, { backgroundColor: colors.pink + '20' }]}>
              <Text style={[adStyles.exploreText, { color: colors.pink }]}>Explore Now</Text>
              <MaterialCommunityIcons name="chevron-right" size={14} color={colors.pink} />
           </View>
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
  wrapper: { marginBottom: Spacing.xl },
  slideContainer: {
    paddingHorizontal: 0,
    height: 200,
  },
  slide: {
    flex: 1,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    ...Shadows.lg,
    backgroundColor: '#000',
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
  advertiserName: {
    color: '#fff',
    fontFamily: Fonts.extraBold,
    fontSize: 24,
    letterSpacing: -0.5,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  exploreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  exploreText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    marginRight: 2,
    textTransform: 'uppercase',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: { height: 6, borderRadius: 3 },
});
