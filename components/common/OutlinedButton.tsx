import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  View,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, FontSizes, BorderRadius, Fonts } from '@/constants/theme';
import { useTranslation } from '@/contexts/LanguageContext';
import Text from '@/components/common/LocalizedText';

type OutlinedButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textColor?: string;
  borderColor?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconSize?: number;
};

export default function OutlinedButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textColor,
  borderColor,
  icon,
  iconSize = 20,
}: OutlinedButtonProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const activeColor = textColor || colors.pink;
  const borderCol = borderColor || colors.accentBorder;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, { borderColor: borderCol, backgroundColor: colors.surfaceElevated }, (disabled || loading) && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={activeColor} />
      ) : (
        <View style={styles.content}>
          {icon && <MaterialCommunityIcons name={icon} size={iconSize} color={activeColor} style={styles.icon} />}
          <Text style={[styles.text, { color: activeColor }]}>{t(title)}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    minHeight: 56,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.bold,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: Spacing.sm,
  },
});
