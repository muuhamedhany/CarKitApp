import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, FontSizes, Spacing, BorderRadius, Fonts } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem('hasSeenOnboarding');
    router.replace('/onboarding');
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="car-sports" size={64} color={Colors.pink} />
      <Text style={styles.title}>CarKit</Text>
      <Text style={styles.subtitle}>
        {user ? `Welcome, ${user.name}!` : 'Welcome! The app is being built.'}
      </Text>

      <Pressable style={styles.resetButton} onPress={resetOnboarding}>
        <MaterialCommunityIcons name="refresh" size={18} color={Colors.purpleLight} />
        <Text style={styles.resetText}>  Replay Onboarding</Text>
      </Pressable>

      <Pressable style={[styles.resetButton, { marginTop: Spacing.md }]} onPress={handleLogout}>
        <MaterialCommunityIcons name="logout" size={18} color={Colors.pink} />
        <Text style={[styles.resetText, { color: Colors.pink }]}>  Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    color: Colors.pink,
    fontSize: FontSizes.xxxl,
    fontFamily: Fonts.extraBold,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    fontFamily: Fonts.regular,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.3)',
  },
  resetText: {
    color: Colors.purpleLight,
    fontSize: FontSizes.md,
    fontFamily: Fonts.semiBold,
  },
});
