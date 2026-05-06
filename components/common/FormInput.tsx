import { View, TextInput, StyleSheet, Pressable, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, BorderRadius, Fonts } from '@/constants/theme';

type FormInputProps = {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  showToggle?: boolean;
  onToggle?: () => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric' | 'number-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  autoComplete?: 'email' | 'name' | 'tel' | 'off';
  label?: string;
  maxLength?: number;
};

export default function FormInput({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  showToggle = false,
  onToggle,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete = 'off',
  label,
  maxLength,
}: FormInputProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.outerContainer}>
      {label && <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>}
      <View style={[styles.container, { borderColor: colors.inputBorder }]}>
      <MaterialCommunityIcons
        name={icon as any}
        size={20}
        color={colors.textMuted}
        style={styles.icon}
      />
      <TextInput
        style={[styles.input, { color: colors.textPrimary }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        maxLength={maxLength}
      />
      {showToggle && onToggle && (
        <Pressable onPress={onToggle}>
          <MaterialCommunityIcons
            name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={colors.textMuted}
          />
        </Pressable>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    height: 52,
  },
  outerContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
    marginBottom: 8,
    marginLeft: 4,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    fontFamily: Fonts.regular,
  },
});
