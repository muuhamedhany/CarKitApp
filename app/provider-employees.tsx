import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CenteredHeader } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { emergencyService, EmergencyEmployee } from '@/services/api/emergency.service';

export default function ProviderEmployeesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [employees, setEmployees] = useState<EmergencyEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => emergencyService.getEmployees().then((res) => setEmployees(res.data || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.bgGradientStart, colors.bgGradientEnd]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content}>
        <CenteredHeader title="Emergency Team" titleColor={colors.textPrimary} />
        <Pressable style={[styles.addButton, { backgroundColor: colors.pink }]} onPress={() => router.push('/add-employee' as any)}>
          <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
          <Text style={styles.addText}>Add Employee</Text>
        </Pressable>
        {loading ? <ActivityIndicator color={colors.pink} /> : null}
        {employees.map((employee) => (
          <View key={employee.employee_id} style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
            <View>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{employee.full_name}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>{employee.phone}</Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>{employee.service_ids?.length || 0}/2 services assigned</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: employee.is_online ? colors.successSoft : colors.surfaceMuted }]}>
              <Text style={[styles.badgeText, { color: employee.is_online ? colors.success : colors.textMuted }]}>{employee.is_online ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  addButton: { minHeight: 52, borderRadius: BorderRadius.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  addText: { color: '#fff', fontFamily: Fonts.bold, textTransform: 'uppercase' },
  card: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.md, marginBottom: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  name: { fontFamily: Fonts.bold, fontSize: FontSizes.md },
  meta: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginTop: 3 },
  badge: { borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  badgeText: { fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase' },
});
