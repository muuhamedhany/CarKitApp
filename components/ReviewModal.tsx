import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { reviewService } from '@/services/api/review.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import GlassView from './common/GlassView';
import GradientButton from './common/GradientButton';
import { StarRating } from './common/StarRating';

const { height } = Dimensions.get('window');

interface ReviewItem {
  id: number;
  name: string;
  type: 'product' | 'service';
  rating: number;
  comment: string;
}

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  entityId: number; // vendor_id or provider_id
  entityName: string;
  entityType: 'vendor' | 'provider';
  items: ReviewItem[]; // Products in order or Service in booking
  orderId?: number;
  bookingId?: number;
  onSuccess?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  entityId,
  entityName,
  entityType,
  items: initialItems,
  orderId,
  bookingId,
  onSuccess,
}) => {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // State for entity rating
  const [entityRating, setEntityRating] = useState(0);
  const [entityComment, setEntityComment] = useState('');

  // State for items rating
  const [items, setItems] = useState<ReviewItem[]>(initialItems);

  const handleItemRatingChange = (id: number, rating: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, rating } : item));
  };

  const handleItemCommentChange = (id: number, comment: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, comment } : item));
  };

  const handleSubmit = async () => {
    if (entityRating === 0) {
      showToast('error', 'Rating Required', `Please provide a rating for ${entityName}`);
      return;
    }

    try {
      setSubmitting(true);

      // Check if anything was rated
      const hasItemRating = items.some(item => item.rating > 0);
      if (entityRating === 0 && !hasItemRating) {
        showToast('error', 'No Rating', 'Please provide at least one rating.');
        setSubmitting(false);
        return;
      }

      // 1. Submit Entity Review (if rated)
      if (entityRating > 0) {
        const entityPayload = {
          rating: entityRating,
          comment: entityComment,
          [entityType === 'vendor' ? 'vendor_id_fk' : 'provider_id_fk']: entityId,
          order_id_fk: orderId,
          booking_id_fk: bookingId,
        };
        await reviewService.submitReview(entityPayload);
      }

      // 2. Submit Item Reviews
      for (const item of items) {
        if (item.rating > 0) {
          const itemPayload = {
            rating: item.rating,
            comment: item.comment,
            [item.type === 'product' ? 'product_id_fk' : 'service_id_fk']: item.id,
            order_id_fk: orderId,
            booking_id_fk: bookingId,
          };
          await reviewService.submitReview(itemPayload);
        }
      }

      showToast('success', 'Review Submitted', 'Thank you for your feedback!');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      showToast('error', 'Submission Failed', error.message || 'Could not submit your review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.dismissArea} onPress={onClose} />

        <GlassView
          intensity={isDark ? 50 : 80}
          tint={isDark ? 'dark' : 'light'}
          style={styles.modalContent}
        >
          <View style={[styles.handle, { backgroundColor: colors.cardBorder }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Rate Your Experience</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Entity Rating */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {entityType === 'vendor' ? 'Vendor' : 'Provider'}: {entityName}
              </Text>
              <StarRating
                rating={entityRating}
                onRatingChange={setEntityRating}
                size={36}
                style={styles.stars}
              />
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: colors.surfaceMuted,
                  color: colors.textPrimary,
                  borderColor: colors.cardBorder
                }]}
                placeholder={`Share your experience with this ${entityType}...`}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                value={entityComment}
                onChangeText={setEntityComment}
              />
            </View>

            {/* Items Rating */}
            {items.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.md }]}>
                  {items[0].type === 'product' ? 'Products' : 'Service'}
                </Text>
                {items.map((item) => (
                  <View key={item.id} style={styles.itemContainer}>
                    <Text style={[styles.itemName, { color: colors.textSecondary }]}>{item.name}</Text>
                    <StarRating
                      rating={item.rating}
                      onRatingChange={(r) => handleItemRatingChange(item.id, r)}
                      size={28}
                      style={styles.itemStars}
                    />
                    <TextInput
                      style={[styles.smallTextInput, {
                        backgroundColor: colors.surfaceMuted,
                        color: colors.textPrimary,
                        borderColor: colors.cardBorder
                      }]}
                      placeholder="Comment (optional)..."
                      placeholderTextColor={colors.textMuted}
                      value={item.comment}
                      onChangeText={(c) => handleItemCommentChange(item.id, c)}
                    />
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <GradientButton
              title={submitting ? "Submitting..." : "Submit Review"}
              onPress={handleSubmit}
              loading={submitting}
              icon="check"
            />
          </View>
        </GlassView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dismissArea: {
    flex: 1,
  },
  modalContent: {
    maxHeight: height * 0.85,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
    marginBottom: Spacing.sm,
  },
  stars: {
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  textInput: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  itemContainer: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  itemName: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  itemStars: {
    marginBottom: Spacing.sm,
  },
  smallTextInput: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
  },
  footer: {
    marginTop: Spacing.md,
    marginBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg,
  },
});
