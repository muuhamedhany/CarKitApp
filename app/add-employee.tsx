import {
  useEffect,
  useState } from 'react';
import { Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CenteredHeader } from '@/components';
import FormInput from '@/components/common/FormInput';
import { BorderRadius, FontSizes, Fonts, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { emergencyService, EmergencyServiceOption } from '@/services/api/emergency.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '@/components/common/LocalizedText';

const MAX_ASSIGNED_SERVICES = 2;

const getServiceConfig = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('towing') || lowerName.includes('ونش') || lowerName.includes('سحب')) {
    return { icon: 'truck-flatbed' as const, color: '#FF3D00' };
  }
  if (lowerName.includes('battery') || lowerName.includes('بطارية') || lowerName.includes('شحن')) {
    return { icon: 'car-battery' as const, color: '#FFAB00' };
  }
  if (lowerName.includes('tire') || lowerName.includes('إطار') || lowerName.includes('كاوتش')) {
    return { icon: 'car-tire-alert' as const, color: '#2979FF' };
  }
  if (lowerName.includes('fuel') || lowerName.includes('gas') || lowerName.includes('وقود') || lowerName.includes('بنزين')) {
    return { icon: 'gas-station' as const, color: '#00C853' };
  }
  if (lowerName.includes('key') || lowerName.includes('lock') || lowerName.includes('مفتاح') || lowerName.includes('قفل')) {
    return { icon: 'car-key' as const, color: '#9C27B0' };
  }
  return { icon: 'car-wrench' as const, color: '#CD42A8' };
};

export default function AddEmployeeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [services, setServices] = useState<EmergencyServiceOption[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [form, setForm] = useState({ full_name: '', phone: '', password: '' });

  useEffect(() => {
    emergencyService
      .getServices()
      .then((res) => setServices(res.data || []))
      .catch(() => showToast('error', 'Emergency Services', 'Could not load emergency services.'));
  }, [showToast]);

  const toggle = (id: number) => {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= MAX_ASSIGNED_SERVICES) {
        showToast('warning', 'Emergency Services', 'Each employee can be assigned to at most 2 services.');
        return current;
      }
      return [...current, id];
    });
  };

  const submit = async () => {
    if (selected.length === 0) {
      showToast('warning', 'Emergency Services', 'Assign at least one emergency service.');
      return;
    }

    try {
      await emergencyService.createEmployee({ ...form, service_ids: selected });
      showToast('success', 'Employee Added', 'Emergency employee can now log in.');
      router.back();
    } catch {
      showToast('error', 'Employee', 'Could not create employee.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.bgGradientStart, colors.bgGradientEnd]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content}>
        <CenteredHeader
          title="Add Employee"
          titleColor={colors.textPrimary}
          rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
        />
        <FormInput
          label="Name"
          icon="account-outline"
          placeholder="Driver full name"
          value={form.full_name}
          onChangeText={(v: string) => setForm({ ...form, full_name: v })}
          autoCapitalize="words"
          autoComplete="name"
        />
        <FormInput
          label="Phone"
          icon="phone-outline"
          placeholder="Driver phone number"
          value={form.phone}
          onChangeText={(v: string) => setForm({ ...form, phone: v })}
          keyboardType="phone-pad"
          autoComplete="tel"
        />
        <FormInput
          label="Password"
          icon="lock-outline"
          placeholder="Create a password"
          value={form.password}
          secureTextEntry
          onChangeText={(v: string) => setForm({ ...form, password: v })}
        />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Emergency services</Text>
        <Text style={[styles.assignmentHint, { color: colors.textMuted }]}>{selected.length}/{MAX_ASSIGNED_SERVICES} services selected</Text>
        <View style={styles.roleGrid}>
          {services.map((service) => {
            const isSelected = selected.includes(service.service_id);
            const config = getServiceConfig(service.name);

            return (
              <Pressable
                key={service.service_id}
                style={({ pressed }) => [
                  styles.roleCard,
                  {
                    borderColor: isSelected ? config.color : colors.cardBorder,
                    backgroundColor: isSelected ? config.color + '12' : colors.surfaceElevated,
                    opacity: pressed ? 0.86 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
                onPress={() => toggle(service.service_id)}
              >
                <LinearGradient
                  colors={isSelected ? [config.color + '24', config.color + '05'] : [colors.surfaceMuted, colors.transparent]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.roleIconWrap, { backgroundColor: config.color + '18' }]}>
                  <MaterialCommunityIcons name={config.icon} size={30} color={config.color} />
                </View>
                <Text numberOfLines={2} style={[styles.roleName, { color: colors.textPrimary }]}>
                  {service.name}
                </Text>
                <View style={[styles.roleCheck, { backgroundColor: isSelected ? config.color : colors.surfaceMuted, borderColor: isSelected ? config.color : colors.cardBorder }]}>
                  <MaterialCommunityIcons name={isSelected ? 'check-bold' : 'plus'} size={14} color={isSelected ? '#FFFFFF' : colors.textMuted} />
                </View>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={[styles.submit, { backgroundColor: colors.pink }]} onPress={submit}>
          <Text style={styles.submitText}>Create Employee</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xxl },
  sectionTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: Spacing.sm },
  assignmentHint: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginBottom: Spacing.sm },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing.md },
  roleCard: {
    width: '48%',
    minHeight: 142,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    padding: Spacing.md,
    justifyContent: 'space-between',
    ...Shadows.sm,
  },
  roleIconWrap: { width: 52, height: 52, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  roleName: { fontFamily: Fonts.bold, fontSize: FontSizes.sm, lineHeight: 20, marginTop: Spacing.sm, paddingRight: Spacing.lg },
  roleCheck: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  submit: { minHeight: 54, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg },
  submitText: { color: '#fff', fontFamily: Fonts.bold, textTransform: 'uppercase' },
});
