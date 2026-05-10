import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  color?: string;
  style?: ViewStyle;
  readonly?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  onRatingChange,
  size = 24,
  color,
  style,
  readonly = false,
}) => {
  const { colors } = useTheme();
  const starColor = color || '#FFD700'; // Default gold

  const stars = [];
  for (let i = 1; i <= maxStars; i++) {
    const isFull = i <= Math.floor(rating);
    const isHalf = !isFull && i - 0.5 <= rating;

    stars.push(
      <TouchableOpacity
        key={i}
        onPress={() => !readonly && onRatingChange?.(i)}
        activeOpacity={readonly ? 1 : 0.7}
        disabled={readonly}
      >
        <MaterialCommunityIcons
          name={isFull ? 'star' : isHalf ? 'star-half-full' : 'star-outline'}
          size={size}
          color={isFull || isHalf ? starColor : colors.textMuted}
          style={{ marginRight: 2 }}
        />
      </TouchableOpacity>
    );
  }

  return <View style={[styles.container, style]}>{stars}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
