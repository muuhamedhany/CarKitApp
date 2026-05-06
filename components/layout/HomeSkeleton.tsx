import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Skeleton } from '../common/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function HomeSkeleton() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View>
          <Skeleton width={100} height={14} style={{ marginBottom: 8 }} />
          <Skeleton width={160} height={28} />
        </View>
        <Skeleton width={45} height={45} borderRadius={22.5} />
      </View>

      {/* Search Bar Skeleton */}
      <Skeleton height={54} borderRadius={BorderRadius.xl} style={{ marginBottom: Spacing.xl }} />

      {/* Ads Skeleton */}
      <Skeleton height={200} borderRadius={BorderRadius.xxl} style={{ marginBottom: Spacing.xl }} />

      {/* Section Skeleton */}
      <View style={styles.section}>
        <Skeleton width={180} height={24} style={{ marginBottom: Spacing.md }} />
        <View style={styles.pillsRow}>
          <Skeleton width={90} height={36} borderRadius={18} />
          <Skeleton width={90} height={36} borderRadius={18} />
          <Skeleton width={90} height={36} borderRadius={18} />
        </View>
      </View>

      {/* Grid Skeleton */}
      <View style={styles.grid}>
        <View style={styles.column}>
           <Skeleton height={220} borderRadius={BorderRadius.xl} />
           <Skeleton height={180} borderRadius={BorderRadius.xl} />
        </View>
        <View style={styles.column}>
           <Skeleton height={180} borderRadius={BorderRadius.xl} />
           <Skeleton height={220} borderRadius={BorderRadius.xl} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  grid: {
    flexDirection: 'row',
    gap: 15,
  },
  column: {
    flex: 1,
    gap: 15,
  },
});
