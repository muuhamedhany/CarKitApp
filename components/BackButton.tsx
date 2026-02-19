import { Pressable, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Fonts } from '@/constants/theme';

type BackButtonProps = {
  onPress: () => void;
};

export default function BackButton({ onPress }: BackButtonProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.white} />
      <Text style={styles.text}>  Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  text: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontFamily: Fonts.semiBold,
  },
});
