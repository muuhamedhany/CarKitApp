import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useTranslation } from '@/contexts/LanguageContext';
import Text from '@/components/common/LocalizedText';
import GlassView from '@/components/common/GlassView';
import GradientButton from '@/components/common/GradientButton';
import { Vehicle } from '@/types/api.types';
import { rowDirection, textAlign } from '@/utils/rtl';

const { height } = Dimensions.get('window');

interface VehicleSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onAddNewVehicle: () => void;
}

export default function VehicleSelectionModal({
  visible,
  onClose,
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  onAddNewVehicle,
}: VehicleSelectionModalProps) {
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useTranslation();
  const [tempSelected, setTempSelected] = useState<Vehicle | null>(selectedVehicle);

  useEffect(() => {
    if (visible) {
      setTempSelected(selectedVehicle);
    }
  }, [visible, selectedVehicle]);

  const handleConfirm = () => {
    if (tempSelected) {
      onSelectVehicle(tempSelected);
      onClose();
    }
  };

  const handleAddNew = () => {
    onClose();
    onAddNewVehicle();
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => {
    const isSelected = tempSelected?.vehicle_id === item.vehicle_id;
    const vehicleName = item.nickname && item.nickname.trim().length > 0
      ? item.nickname
      : `${item.make_name || item.make} ${item.model_name || item.model}`;
    const vehicleDesc = `${item.year || ''} ${item.make_name || item.make || ''} ${item.model_name || item.model || ''}`.trim();

    return (
      <Pressable
        style={({ pressed }) => [
          styles.vehicleCard,
          {
            backgroundColor: isSelected
              ? (isDark ? colors.background : colors.background)
              : colors.surfaceElevated,
            borderColor: isSelected ? colors.pink : colors.cardBorder,
            opacity: pressed ? 0.9 : 1,
            flexDirection: rowDirection(isRTL),
          },
        ]}
        onPress={() => setTempSelected(item)}
      >
        {/* Vehicle Photo / Fallback Placeholder */}
        {item.photo_url ? (
          <Image source={{ uri: item.photo_url }} style={styles.vehicleImage} resizeMode="cover" />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.surfaceMuted }]}>
            <MaterialCommunityIcons name="car-sports" size={24} color={colors.pink} />
          </View>
        )}

        {/* Details */}
        <View style={styles.vehicleDetails}>
          <Text style={[styles.vehicleNickname, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]} numberOfLines={1}>
            {vehicleName}
          </Text>
          <Text style={[styles.vehicleSub, { color: colors.textSecondary, textAlign: textAlign(isRTL) }]} numberOfLines={1}>
            {vehicleDesc}
          </Text>
        </View>

        {/* Selection Checkbox */}
        <View style={styles.checkContainer}>
          <MaterialCommunityIcons
            name={isSelected ? 'check-circle' : 'circle-outline'}
            size={22}
            color={isSelected ? colors.pink : colors.textMuted}
          />
        </View>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Tap outside to close */}
        <Pressable style={styles.overlayTouchable} onPress={onClose} />

        <GlassView
          intensity={isDark ? 30 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.sheet, { borderColor: colors.cardBorder }]}
        >
          {/* Top handle pill for visual feedback */}
          <View style={[styles.handle, { backgroundColor: colors.cardBorder }]} />

          {/* Header */}
          <View style={[styles.header, { flexDirection: rowDirection(isRTL) }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t('search.vehicleSelectionTitle')}
            </Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: textAlign(isRTL) }]}>
            {t('search.vehicleSelectionSubtitle')}
          </Text>

          {/* List of Vehicles */}
          <View style={styles.listContainer}>
            <FlatList
              data={vehicles}
              keyExtractor={(item) => item.vehicle_id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={renderVehicleItem}
              ListFooterComponent={
                <Pressable
                  style={({ pressed }) => [
                    styles.addCard,
                    {
                      borderColor: colors.pink,
                      backgroundColor: isDark ? 'rgba(205, 66, 168, 0.03)' : 'rgba(184, 50, 145, 0.02)',
                      opacity: pressed ? 0.8 : 1,
                      flexDirection: rowDirection(isRTL),
                    },
                  ]}
                  onPress={handleAddNew}
                >
                  <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.pink} />
                  <Text style={[styles.addText, { color: colors.pink }]}>
                    {t('search.addNewVehicle')}
                  </Text>
                </Pressable>
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    {t('search.noVehiclesFound')}
                  </Text>
                  <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                    {t('search.noVehiclesSubtitle')}
                  </Text>
                </View>
              }
              contentContainerStyle={styles.scrollList}
            />
          </View>

          {/* Footer Action */}
          {vehicles.length > 0 && (
            <View style={styles.footer}>
              <GradientButton
                title={t('search.confirmSelection')}
                onPress={handleConfirm}
                disabled={!tempSelected}
              />
            </View>
          )}
        </GlassView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  sheet: {
    maxHeight: height * 0.8,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
    opacity: 0.8,
  },
  listContainer: {
    maxHeight: height * 0.45,
  },
  scrollList: {
    paddingBottom: Spacing.md,
  },
  vehicleCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.sm,
  },
  vehicleImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleNickname: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginBottom: 2,
  },
  vehicleSub: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    opacity: 0.7,
  },
  checkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  addText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    textAlign: 'center',
    opacity: 0.7,
  },
  footer: {
    marginTop: Spacing.md,
  },
});
