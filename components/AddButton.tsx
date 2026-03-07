import { Pressable, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Fonts } from '@/constants/theme';

type AddButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function AddButton({
  title,
  onPress,
  disabled = false,
  style,
}: AddButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.disabled, style]}
    >
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="plus" size={16} color={Colors.white} />
      </View>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.purple,
    backgroundColor: Colors.transparent,
  },
  disabled: {
    opacity: 0.6,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  text: {
    color: Colors.purple,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bold,
  },
});
