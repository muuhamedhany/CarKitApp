import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export default function AddVehiclePromptScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const handlePress = (path: string, replace = false) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (replace) {
      router.replace(path as any);
    } else {
      router.push(path as any);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[isDark ? '#0F172A' : '#F8FAFC', isDark ? '#020617' : '#F1F5F9']}
        style={StyleSheet.absoluteFill}
      />
      
      <Animated.View entering={FadeInDown.duration(1000)} style={[styles.orb, styles.orb1, { backgroundColor: colors.pink }]} />
      <Animated.View entering={FadeInUp.duration(1000).delay(200)} style={[styles.orb, styles.orb2, { backgroundColor: colors.purple }]} />

      <View style={styles.content}>
        <Animated.View 
          entering={FadeInUp.delay(200).springify()}
          style={styles.header}
        >
          <View style={[styles.mainIconCircle, { backgroundColor: colors.pink + '20' }]}>
            <MaterialCommunityIcons name="car-electric" size={60} color={colors.pink} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Have a Vehicle?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Add it now to get personalized service recommendations and track maintenance history.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Pressable
            style={({ pressed }) => [
              styles.optionWrapper,
              { transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]}
            onPress={() => handlePress('/add-vehicle-signup')}
          >
            <BlurView
              intensity={isDark ? 30 : 50}
              tint={isDark ? 'dark' : 'light'}
              style={[styles.optionCard, { borderColor: colors.pink + '40' }]}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.pink + '20' }]}>
                <MaterialCommunityIcons name="plus" size={28} color={colors.pink} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Yes, Add Vehicle</Text>
                <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>Quickly add your car details</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
            </BlurView>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <Pressable
            style={({ pressed }) => [
              styles.optionWrapper,
              { transform: [{ scale: pressed ? 0.98 : 1 }] }
            ]}
            onPress={() => handlePress('/(tabs)', true)}
          >
            <BlurView
              intensity={isDark ? 20 : 40}
              tint={isDark ? 'dark' : 'light'}
              style={[styles.optionCard, { borderColor: 'rgba(255,255,255,0.1)' }]}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.purple + '20' }]}>
                <MaterialCommunityIcons name="clock-outline" size={28} color={colors.purple} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Skip for Now</Text>
                <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>You can add it later in profile</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
            </BlurView>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    opacity: 0.12,
  },
  orb1: { top: -width * 0.2, right: -width * 0.1 },
  orb2: { bottom: height * 0.1, left: -width * 0.3 },

  content: { 
    flex: 1, 
    justifyContent: 'center', 
    paddingHorizontal: Spacing.xl 
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  mainIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: { 
    fontSize: 32, 
    fontFamily: Fonts.extraBold, 
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 12 
  },
  subtitle: { 
    fontSize: FontSizes.md, 
    fontFamily: Fonts.medium, 
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.7,
    paddingHorizontal: 10
  },
  optionWrapper: {
    marginBottom: Spacing.md,
  },
  optionCard: {
    flexDirection: 'row', 
    alignItems: 'center',
    borderRadius: BorderRadius.xxl, 
    borderWidth: 1, 
    padding: Spacing.xl,
    overflow: 'hidden',
  },
  iconCircle: {
    width: 54, 
    height: 54, 
    borderRadius: 27,
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionText: { flex: 1 },
  optionTitle: { 
    fontSize: FontSizes.lg, 
    fontFamily: Fonts.bold 
  },
  optionSubtitle: { 
    fontSize: FontSizes.sm, 
    fontFamily: Fonts.medium, 
    marginTop: 2,
    opacity: 0.6
  },
});
