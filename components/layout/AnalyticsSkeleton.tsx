import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { Spacing, BorderRadius } from '@/constants/theme';

export const AnalyticsSkeleton = () => {
  const { width } = useWindowDimensions();
  const cardWidth = width - Spacing.md * 2;

  return (
    <View style={styles.container}>
      {/* Revenue Card Skeleton */}
      <Skeleton 
        width={cardWidth} 
        height={100} 
        borderRadius={BorderRadius.xl} 
        style={styles.card} 
      />

      {/* Stats Grid Skeleton */}
      <View style={styles.grid}>
        <Skeleton 
          width={(cardWidth - Spacing.md) / 2} 
          height={120} 
          borderRadius={BorderRadius.lg} 
        />
        <Skeleton 
          width={(cardWidth - Spacing.md) / 2} 
          height={120} 
          borderRadius={BorderRadius.lg} 
        />
      </View>

      {/* Chart Card Skeleton */}
      <Skeleton 
        width={cardWidth} 
        height={240} 
        borderRadius={BorderRadius.xl} 
        style={styles.card} 
      />

      {/* Donut Card Skeleton */}
      <Skeleton 
        width={cardWidth} 
        height={180} 
        borderRadius={BorderRadius.xl} 
        style={styles.card} 
      />

      {/* Service/Product List Skeleton */}
      <Skeleton 
        width={cardWidth} 
        height={200} 
        borderRadius={BorderRadius.xl} 
        style={styles.card} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  card: {
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
});
