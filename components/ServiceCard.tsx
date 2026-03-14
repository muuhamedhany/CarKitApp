import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

type Props = {
  name: string;
  providerName?: string;
  price?: string | number;
  duration?: number; // minutes
  imageUrl?: string;
  onPress?: () => void;
  onBookNow?: () => void;
  /** compact = horizontal card for home; full = vertical for search list */
  variant?: 'compact' | 'full';
};

export default function ServiceCard({
  name, providerName, price, duration, imageUrl,
  onPress, onBookNow, variant = 'compact',
}: Props) {
  if (variant === 'full') {
    return (
      <Pressable style={styles.fullCard} onPress={onPress}>
        <View style={styles.fullInfo}>
          <Text style={styles.fullName} numberOfLines={1}>{name}</Text>
          {providerName && <Text style={styles.fullProvider}>{providerName}</Text>}
          <View style={styles.fullMeta}>
            {duration !== undefined && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.metaText}>{duration} mins</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.fullRight}>
          {price !== undefined && <Text style={styles.fullPrice}>{price} EGP</Text>}
          <View style={styles.fullButtons}>
            {onBookNow && (
              <Pressable onPress={onBookNow}>
                <LinearGradient
                  colors={[Colors.gradientStart, Colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.bookBtn}
                >
                  <Text style={styles.bookBtnText}>Book Now</Text>
                </LinearGradient>
              </Pressable>
            )}
            {onPress && (
              <Pressable style={styles.viewBtn} onPress={onPress}>
                <Text style={styles.viewBtnText}>View</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    );
  }

  // Compact variant — horizontal card for home screen
  return (
    <Pressable style={styles.compactCard} onPress={onPress}>
      <View style={styles.compactImageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.compactImage} contentFit="cover" />
        ) : (
          <LinearGradient
            colors={['rgba(156,39,176,0.5)', 'rgba(233,30,140,0.5)']}
            style={styles.compactImage}
          >
            <MaterialCommunityIcons name="wrench" size={40} color={Colors.white} />
          </LinearGradient>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.compactOverlay}
        >
          <Text style={styles.compactName} numberOfLines={2}>{name}</Text>
          {price !== undefined && (
            <Text style={styles.compactPrice}>Starting at {price} EGP</Text>
          )}
          <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.pink} />
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Compact variant (Home)
  compactCard: {
    width: 200,
    height: 160,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  compactImageContainer: {
    flex: 1,
  },
  compactImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
  },
  compactName: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.bold,
  },
  compactPrice: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },

  // Full variant (Search)
  fullCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  fullInfo: {
    flex: 1,
  },
  fullName: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontFamily: Fonts.bold,
  },
  fullProvider: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  fullMeta: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.regular,
    marginLeft: 4,
  },
  fullRight: {
    alignItems: 'flex-end',
  },
  fullPrice: {
    color: Colors.pink,
    fontSize: FontSizes.md,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.xs,
  },
  fullButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bookBtn: {
    borderRadius: BorderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  bookBtnText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.semiBold,
  },
  viewBtn: {
    borderRadius: BorderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.pink,
  },
  viewBtnText: {
    color: Colors.pink,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.semiBold,
  },
});
