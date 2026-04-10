import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

type PickerItem = {
  id: number;
  label: string;
};

interface PickerModalProps {
  visible: boolean;
  title: string;
  items: PickerItem[];
  selectedId?: number | null;
  onSelect: (item: PickerItem) => void;
  onClose: () => void;
}

export default function PickerModal({
  visible,
  title,
  items,
  selectedId,
  onSelect,
  onClose,
}: PickerModalProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        {/* Tap outside to close */}
        <Pressable style={styles.overlayTouchable} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* List */}
          <View style={{ minHeight: 300, flexShrink: 1 }}>
            <FlatList
              data={items}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedId;
                return (
                  <Pressable
                    style={[styles.item, { borderBottomColor: colors.border }, isSelected && { backgroundColor: colors.pinkGlow, marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg }]}
                    onPress={() => onSelect(item)}
                  >
                    <Text style={[styles.itemText, { color: colors.textSecondary }, isSelected && { color: colors.pink, fontFamily: Fonts.semiBold }]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons name="check" size={20} color={colors.pink} />
                    )}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No options available</Text>
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '60%',
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
  },
  list: {
    paddingHorizontal: Spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  itemText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.md,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
