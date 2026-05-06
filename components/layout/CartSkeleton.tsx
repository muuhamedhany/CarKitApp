import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Skeleton } from '../common/Skeleton';
import { useTheme } from '@/hooks/useTheme';

export function CartSkeleton() {
  const { isDark } = useTheme();
  
  return (
    <View style={styles.container}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.item, { 
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
        }]}>
          <Skeleton width={80} height={80} borderRadius={16} />
          <View style={styles.content}>
            <Skeleton width="70%" height={18} style={{ marginBottom: 10 }} />
            <Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
            <View style={styles.row}>
              <Skeleton width={30} height={30} borderRadius={15} />
              <Skeleton width={40} height={20} />
              <Skeleton width={30} height={30} borderRadius={15} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    gap: 16,
  },
  item: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
