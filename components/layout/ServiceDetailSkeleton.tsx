import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Skeleton } from '../common/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ServiceDetailSkeleton() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={styles.container}>
      {/* Hero Image Skeleton */}
      <Skeleton width={SCREEN_WIDTH} height={SCREEN_WIDTH * 1.1} borderRadius={0} />
      
      <View style={styles.content}>
        {/* Category & Title */}
        <Skeleton width={80} height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={28} style={{ marginBottom: 16 }} />
        
        {/* Provider Card */}
        <Skeleton height={70} borderRadius={BorderRadius.xl} style={{ marginBottom: Spacing.xl }} />
        
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Skeleton width="48%" height={100} borderRadius={16} />
          <Skeleton width="48%" height={100} borderRadius={16} />
        </View>
        
        {/* Description Section */}
        <Skeleton width={140} height={20} style={{ marginBottom: 12, marginTop: Spacing.xl }} />
        <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={14} style={{ marginBottom: Spacing.xl }} />
        
        {/* Price & Action Skeleton */}
        <View style={styles.footer}>
          <View>
            <Skeleton width={60} height={14} style={{ marginBottom: 4 }} />
            <Skeleton width={120} height={28} />
          </View>
          <Skeleton width={160} height={56} borderRadius={28} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.lg,
    marginTop: -20,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    backgroundColor: 'transparent',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
});
