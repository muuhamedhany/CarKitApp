import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function VendorDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const stats = [
    { label: 'Total Products', value: '0', icon: 'package-variant', color: '#6366F1' },
    { label: 'Orders', value: '0', icon: 'shopping', color: '#10B981' },
    { label: 'Revenue', value: '$0.00', icon: 'currency-usd', color: '#EC4899' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>Hello, {user?.name}</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Vendor Dashboard</Text>
        </View>

        <View style={styles.statsContainer}>
          {stats.map((stat, idx) => (
            <View key={idx} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.iconContainer, { backgroundColor: `${stat.color}15` }]}>
                <MaterialCommunityIcons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Orders</Text>
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No orders yet.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 100,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    marginBottom: Spacing.xs,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xxl,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xl,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },
  section: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    marginBottom: Spacing.xs,
  },
  emptyState: {
    marginTop: Spacing.md,
    padding: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    marginTop: Spacing.md,
  },
});
