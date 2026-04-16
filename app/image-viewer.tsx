import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Fonts } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ImageViewerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { images: imagesParam, initialIndex } = useLocalSearchParams<{
    images: string;
    initialIndex: string;
  }>();

  const images: string[] = imagesParam ? JSON.parse(imagesParam) : [];
  const startIndex = initialIndex ? parseInt(initialIndex, 10) : 0;

  const [activeIndex, setActiveIndex] = useState(startIndex);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  // Scroll to initial index on mount
  const onLayout = useCallback(() => {
    if (startIndex > 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: startIndex, animated: false });
    }
  }, [startIndex]);

  if (images.length === 0) {
    router.back();
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Close button */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.counter}>
          {activeIndex + 1} / {images.length}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Swipeable zoomable images */}
      <FlatList
        ref={flatListRef}
        data={images}
        keyExtractor={(_, i) => i.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onLayout={onLayout}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={styles.page}>
            {/* ScrollView for pinch-to-zoom via maximumZoomScale */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollContent}
              maximumZoomScale={4}
              minimumZoomScale={1}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              centerContent
            >
              <Image
                source={{ uri: item }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            </ScrollView>
          </View>
        )}
      />

      {/* Bottom dot pagination */}
      {images.length > 1 && (
        <View style={[styles.pagination, { paddingBottom: insets.bottom + 16 }]}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counter: {
    color: '#FFFFFF',
    fontFamily: Fonts.medium,
    fontSize: 16,
  },
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  scrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  pagination: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});
