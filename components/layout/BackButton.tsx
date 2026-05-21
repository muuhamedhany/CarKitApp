import {
  useRouter } from 'expo-router';
import { View,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/contexts/LanguageContext';
import { arrowBack } from '@/utils/rtl';

type BackButtonProps = {
  onPress?: () => void;
  noSpacer?: boolean;
};

export default function BackButton({ onPress, noSpacer }: BackButtonProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { isRTL } = useTranslation();
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  // On Android, we need a bit more top space to clear the status bar
  const topOffset = Platform.OS === 'android' ? insets.top + 12 : insets.top + 8;

  return (
    <>
      <View style={[styles.container, { top: topOffset }]}>
        <Pressable 
          onPress={handlePress} 
          style={({ pressed }) => [
            styles.button,
            { 
              backgroundColor: pressed ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
              borderColor: colors.border + '30'
            }
          ]}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <MaterialCommunityIcons name={arrowBack(isRTL) as any} size={26} color={colors.pink} />
        </Pressable>
      </View>
      {!noSpacer && <View style={{ height: (Platform.OS === 'android' ? 60 : 54) + insets.top }} />}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    zIndex: 999,
  },
  button: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
