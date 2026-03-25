import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Fonts } from '@/constants/theme';

type FormInputProps = {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  showToggle?: boolean;
  onToggle?: () => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  autoComplete?: 'email' | 'name' | 'tel' | 'off';
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
}: FormInputProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={icon as any}
        size={20}
        color={Colors.textMuted}
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
      />
      {showToggle && onToggle && (
        <Pressable onPress={onToggle}>
          <MaterialCommunityIcons
            name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={Colors.textMuted}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.35)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    height: 52,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: FontSizes.md,
    fontFamily: Fonts.regular,
  },
});
