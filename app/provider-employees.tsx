import {
  useCallback,
  useEffect,
  useState } from 'react';
import { ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CenteredHeader } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { emergencyService, EmergencyEmployee } from '@/services/api/emergency.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '@/components/common/LocalizedText';

export default function ProviderEmployeesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast, showAlert } = useToast();
  const [employees, setEmployees] = useState<EmergencyEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    emergencyService
      .getEmployees()
      .then((res) => setEmployees(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDelete = (employeeId: number) => {
    showAlert({
      title: 'Delete Employee?',
      message: 'Are you sure you want to delete this employee?',
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await emergencyService.deleteEmployee(employeeId);
              if (res.success) {
                showToast('success', 'Deleted', 'Employee deleted successfully.');
                load();
              } else {
                showToast('error', 'Error', (res as any).message || 'Could not delete employee.');
                setLoading(false);
              }
            } catch (err: any) {
              showToast('error', 'Error', err.message || 'Could not delete employee.');
              setLoading(false);
            }
          },
        },
      ],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.bgGradientStart, colors.bgGradientEnd]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content}>
        <CenteredHeader
          title="Emergency Team"
          titleColor={colors.textPrimary}
          rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
        />
        <Pressable style={[styles.addButton, { backgroundColor: colors.pink }]} onPress={() => router.push('/add-employee' as any)}>
          <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
          <Text style={styles.addText}>Add Employee</Text>
        </Pressable>
        {loading ? <ActivityIndicator color={colors.pink} style={styles.loader} /> : null}
        {employees.map((employee) => (
          <View key={employee.employee_id} style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{employee.full_name}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>{employee.phone}</Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>{employee.service_ids?.length || 0}/2 services assigned</Text>
            </View>
            <View style={styles.cardRight}>
              <View style={[styles.badge, { backgroundColor: employee.is_online ? colors.successSoft : colors.surfaceMuted }]}>
                <Text style={[styles.badgeText, { color: employee.is_online ? colors.success : colors.textMuted }]}>{employee.is_online ? 'Online' : 'Offline'}</Text>
              </View>
              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => router.push({ pathname: '/edit-employee/[id]', params: { id: employee.employee_id.toString() } } as any)}
                  style={styles.actionBtn}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: colors.pink + '15' }]}>
                    <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.pink} />
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(employee.employee_id)}
                  style={styles.actionBtn}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: colors.error + '15' }]}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xxl },
  addButton: { minHeight: 52, borderRadius: BorderRadius.full, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  addText: { color: '#fff', fontFamily: Fonts.bold, textTransform: 'uppercase' },
  card: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.md, marginBottom: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  name: { fontFamily: Fonts.bold, fontSize: FontSizes.md },
  meta: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginTop: 3 },
  badge: { borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-end' },
  badgeText: { fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase' },
  loader: { marginVertical: Spacing.md },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  actionBtn: {
    padding: 2,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
