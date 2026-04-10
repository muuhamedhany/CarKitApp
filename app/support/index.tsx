import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { BackButton } from '@/components';
import { supportService } from '@/services/api';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

export default function SupportScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const fetchTickets = useCallback(async () => {
    try {
      const res = await supportService.getTickets();
      if (res.success) {
        setTickets(res.data);
      }
    } catch (e) {
      console.log('Tickets fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      return showToast('error', 'Missing Fields', 'Please complete all fields.');
    }

    setSubmitting(true);
    try {
      const res = await supportService.createTicket({ subject, message, priority });
      if (res.success) {
        showToast('success', 'Ticket Created', 'Our support team will get back to you shortly.');
        setIsCreating(false);
        setSubject(''); setMessage('');
        fetchTickets();
      } else {
        showToast('error', 'Failed', res.message || 'Could not create ticket.');
      }
    } catch (e: any) {
      showToast('error', 'Error', e.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'open') return colors.warning;
    if (status === 'resolved') return colors.success;
    return colors.textMuted;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }]}>
        <BackButton onPress={() => isCreating ? setIsCreating(false) : router.back()} />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {isCreating ? 'New Ticket' : 'Help & Support'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : isCreating ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information-outline" size={20} color={colors.pink} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Please describe your issue below. Our team typically responds within 24 hours.
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Subject</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Ex. Booking Issue"
                placeholderTextColor={colors.textMuted}
                value={subject}
                onChangeText={setSubject}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Message</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.textPrimary }]}
                placeholder="Provide details about your issue here..."
                placeholderTextColor={colors.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </View>

          <Pressable onPress={handleSubmit} disabled={submitting} style={{ marginTop: Spacing.xl }}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.saveBtn, submitting && { opacity: 0.7 }]}
            >
              {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Submit Ticket</Text>}
            </LinearGradient>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {tickets.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="lifebuoy" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>How can we help?</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>You have no open support tickets. Create one below if you need assistance.</Text>
            </View>
          ) : (
            tickets.map(ticket => (
              <View key={ticket.ticket_id || ticket.id} style={[styles.addressCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                <View style={styles.cardInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {ticket.subject || 'Support Ticket'}
                    </Text>
                    <Text style={[styles.statusBadge, { color: getStatusColor(ticket.status || 'open') }]}>
                      {(ticket.status || 'open').toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.cardAddress, { color: colors.textSecondary }]} numberOfLines={2}>
                    {ticket.message}
                  </Text>
                </View>
              </View>
            ))
          )}

          <Pressable onPress={() => setIsCreating(true)} style={{ marginTop: tickets.length === 0 ? Spacing.xl : Spacing.md }}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              <MaterialCommunityIcons name="pencil-plus-outline" size={20} color={colors.white} />
              <Text style={styles.saveBtnText}>Create Ticket</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: Spacing.md, paddingHorizontal: Spacing.lg,
  },
  headerTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.xl },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 40 },
  
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 64, 129, 0.1)', padding: Spacing.md,
    borderRadius: BorderRadius.md, marginBottom: Spacing.lg, gap: Spacing.sm
  },
  infoText: { flex: 1, fontFamily: Fonts.regular, fontSize: FontSizes.sm, lineHeight: 20 },

  formGroup: { marginBottom: Spacing.lg },
  label: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginBottom: Spacing.sm },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, height: 50,
  },
  textAreaWrapper: { height: 120, alignItems: 'flex-start', paddingVertical: Spacing.sm },
  input: { flex: 1, fontFamily: Fonts.regular, fontSize: FontSizes.md },
  textArea: { height: 100 },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    paddingVertical: 16, borderRadius: BorderRadius.lg,
  },
  saveBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: FontSizes.md },

  addressCard: {
    padding: Spacing.lg, borderWidth: 1, borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  cardInfo: { flex: 1 },
  cardTitle: { flex: 1, fontFamily: Fonts.semiBold, fontSize: FontSizes.md, marginRight: Spacing.sm },
  cardAddress: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginTop: 4, lineHeight: 20 },
  statusBadge: { fontFamily: Fonts.bold, fontSize: FontSizes.xs },
  
  emptyState: { alignItems: 'center', marginTop: 80, marginBottom: 40 },
  emptyTitle: { fontFamily: Fonts.semiBold, fontSize: FontSizes.lg, marginTop: Spacing.md },
  emptySubtitle: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginTop: 4, textAlign: 'center', paddingHorizontal: Spacing.xl, lineHeight: 22 },
});
