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
import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

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
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        {/* Tap outside to close */}
        <Pressable style={styles.overlayTouchable} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={24} color={Colors.textMuted} />
            </Pressable>
          </View>

          {/* List */}
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            style={styles.list}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;
              return (
                <Pressable
                  style={[styles.item, isSelected && styles.itemActive]}
                  onPress={() => onSelect(item)}
                >
                  <Text style={[styles.itemText, isSelected && styles.itemTextActive]}>
                    {item.label}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons name="check" size={20} color={Colors.pink} />
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No options available</Text>
            }
          />
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
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.cardBorder,
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
    borderBottomColor: Colors.border,
  },
  title: {
    color: Colors.textPrimary,
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
    borderBottomColor: Colors.border,
  },
  itemActive: {
    backgroundColor: 'rgba(233,30,140,0.08)',
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  itemText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    fontSize: FontSizes.md,
  },
  itemTextActive: {
    color: Colors.pink,
    fontFamily: Fonts.semiBold,
  },
  emptyText: {
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
