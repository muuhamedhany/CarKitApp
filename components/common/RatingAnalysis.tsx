import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, Spacing, BorderRadius } from '@/constants/theme';
import GlassView from './GlassView';
import { Review } from '@/types/api.types';

interface RatingAnalysisProps {
  reviews: Review[];
  totalRating: number | string;
  reviewCount: number;
}

export const RatingAnalysis: React.FC<RatingAnalysisProps> = ({ reviews, totalRating, reviewCount }) => {
  const { colors, isDark } = useTheme();

  // Calculate distribution
  const distribution = [0, 0, 0, 0, 0]; // 1, 2, 3, 4, 5 stars
  reviews.forEach(review => {
    const rating = Math.round(review.rating || 0);
    if (rating >= 1 && rating <= 5) {
      distribution[rating - 1]++;
    }
  });

  const maxCount = Math.max(...distribution, 1);

  return (
    <GlassView intensity={isDark ? 15 : 30} tint={isDark ? 'dark' : 'light'} style={[styles.container, { borderColor: colors.cardBorder }]}>
      <View style={styles.header}>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { color: colors.textPrimary }]}>
            {typeof totalRating === 'number' ? totalRating.toFixed(1) : totalRating}
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <MaterialCommunityIcons 
                key={i} 
                name={i <= Math.round(Number(totalRating)) ? "star" : "star-outline"} 
                size={16} 
                color="#FBBF24" 
              />
            ))}
          </View>
          <Text style={[styles.totalReviews, { color: colors.textSecondary }]}>
            {reviewCount} reviews
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.barsContainer}>
          {[5, 4, 3, 2, 1].map(star => {
            const count = distribution[star - 1];
            const percentage = (count / reviews.length) || 0;
            
            return (
              <View key={star} style={styles.barRow}>
                <Text style={[styles.starLabel, { color: colors.textSecondary }]}>{star}</Text>
                <View style={[styles.barBg, { backgroundColor: colors.surfaceMuted }]}>
                  <View 
                    style={[
                      styles.barFill, 
                      { 
                        width: `${percentage * 100}%`, 
                        backgroundColor: colors.pink 
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.countLabel, { color: colors.textMuted }]}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </GlassView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: Spacing.lg,
    minWidth: 100,
  },
  scoreText: {
    fontFamily: Fonts.extraBold,
    fontSize: 42,
    lineHeight: 48,
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  totalReviews: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: Spacing.md,
  },
  barsContainer: {
    flex: 1,
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starLabel: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    width: 10,
  },
  barBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  countLabel: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    width: 20,
    textAlign: 'right',
  },
});
