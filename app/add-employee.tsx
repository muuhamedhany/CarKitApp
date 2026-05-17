import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CenteredHeader } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { emergencyService } from '@/services/api/emergency.service';
import { providerService } from '@/services/api/provider.service';
import { Service } from '@/types/api.types';

export default function AddEmployeeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [form, setForm] = useState({ full_name: '', phone: '', password: '' });

  useEffect(() => {
    providerService.getMyServices().then((res) => setServices((res.data || []).filter((service: any) => service.is_emergency)));
  }, []);

  const toggle = (id: number) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const submit = async () => {
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
        <CenteredHeader title="Add Employee" titleColor={colors.textPrimary} />
        <Input label="Name" value={form.full_name} onChangeText={(v: string) => setForm({ ...form, full_name: v })} colors={colors} />
        <Input label="Phone" value={form.phone} onChangeText={(v: string) => setForm({ ...form, phone: v })} colors={colors} />
        <Input label="Password" value={form.password} secureTextEntry onChangeText={(v: string) => setForm({ ...form, password: v })} colors={colors} />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Emergency services</Text>
        {services.map((service) => (
          <Pressable key={service.service_id} style={[styles.serviceRow, { borderColor: colors.cardBorder }]} onPress={() => toggle(service.service_id)}>
            <MaterialCommunityIcons name={selected.includes(service.service_id) ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} size={22} color={selected.includes(service.service_id) ? colors.pink : colors.textMuted} />
            <Text style={[styles.serviceName, { color: colors.textPrimary }]}>{service.name}</Text>
          </Pressable>
        ))}
        <Pressable style={[styles.submit, { backgroundColor: colors.pink }]} onPress={submit}>
          <Text style={styles.submitText}>Create Employee</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Input({ label, colors, ...props }: any) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput {...props} style={[styles.input, { color: colors.textPrimary, borderColor: colors.cardBorder, backgroundColor: colors.surfaceElevated }]} placeholderTextColor={colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  label: { fontFamily: Fonts.bold, fontSize: FontSizes.xs, marginBottom: Spacing.xs },
  input: { minHeight: 52, borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, fontFamily: Fonts.medium },
  sectionTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: Spacing.sm },
  serviceRow: { minHeight: 52, borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  serviceName: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },
  submit: { minHeight: 54, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg },
  submitText: { color: '#fff', fontFamily: Fonts.bold, textTransform: 'uppercase' },
});
