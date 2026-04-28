import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import { GradientButton } from '@/components';

export default function BookingSuccessScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const bookingId = params.bookingId || 'N/A';
  const serviceName = params.serviceName || 'Service';
  const price = params.price || '0';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="check" size={48} color="#FFFFFF" />
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>Booking Confirmed!</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Your service has been successfully booked
      </Text>

      <View style={[styles.detailsCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Booking Details</Text>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Booking ID</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>#{bookingId}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Service</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{serviceName}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Amount Paid</Text>
          <Text style={[styles.detailValue, { color: colors.pink }]}>{price} EGP</Text>
        </View>
      </View>

      <Text style={[styles.infoText, { color: colors.textMuted }]}>
        The service provider will review your booking and confirm the appointment.
      </Text>

      <View style={styles.buttonRow}>
        <GradientButton
          title="View My Bookings"
          onPress={() => router.push('/my-bookings')}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.lg, alignItems: 'center' },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center',
    marginTop: Spacing.xxl, marginBottom: Spacing.xl,
  },
  title: { fontFamily: Fonts.bold, fontSize: FontSizes.xxl, textAlign: 'center' },
  subtitle: { fontFamily: Fonts.regular, fontSize: FontSizes.md, textAlign: 'center', marginTop: Spacing.sm },
  detailsCard: {
    width: '100%', borderWidth: 1, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginTop: Spacing.xl,
  },
  cardTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: Spacing.md },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailLabel: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
  detailValue: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
  infoText: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, textAlign: 'center', marginTop: Spacing.lg },
  buttonRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl, width: '100%' },
});
