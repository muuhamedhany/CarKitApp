import {
  BorderRadius,
  Fonts,
  FontSizes,
  Spacing } from '@/constants/theme';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Text from '@/components/common/LocalizedText';
import TextInput from '@/components/common/LocalizedTextInput';

type FormInputProps = {
  icon?: string;
  placeholder?: string;
  value: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  showToggle?: boolean;
  onToggle?: () => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric' | 'number-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  autoComplete?: 'email' | 'name' | 'tel' | 'off';
  label?: string;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'next' | 'search' | 'send';
  editable?: boolean;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: any;
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
  multiline = false,
  numberOfLines,
  onSubmitEditing,
  returnKeyType,
  editable = true,
  rightIcon,
  onRightIconPress,
  containerStyle,
}: FormInputProps) {
  const { colors } = useTheme();
  const { t, isRTL } = useTranslation();

  return (
    <View style={[styles.outerContainer, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t(label)}</Text>}
      <View style={[styles.container, {
        borderColor: colors.inputBorder,
        backgroundColor: colors.FormBg,
        height: multiline ? (numberOfLines ? numberOfLines * 24 + 20 : 100) : 52,
        alignItems: multiline ? 'flex-start' : 'center',
        paddingVertical: multiline ? Spacing.sm : 0,
      }]}>
        {icon && (
          <MaterialCommunityIcons
            name={icon as any}
            size={18}
            color={colors.textMuted}
            style={[styles.icon, multiline && { marginTop: 4 }]}
          />
        )}
        <TextInput
          style={[styles.input, { color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }, multiline && { textAlignVertical: 'top' }]}
          placeholder={placeholder ? t(placeholder) : undefined}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          editable={editable}
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
        {rightIcon && onRightIconPress && (
          <Pressable onPress={onRightIconPress}>
            <MaterialCommunityIcons
              name={rightIcon as any}
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
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
    opacity: 0.6
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
