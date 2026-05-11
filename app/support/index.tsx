import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInLeft, FadeInUp, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CenteredHeader, GlassView, GradientButton, OutlinedButton } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { supportService } from '@/services/api';

const { width, height } = Dimensions.get('window');

export default function SupportScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return showToast('error', 'Missing Fields', 'Please complete all fields.');
    }

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await supportService.createTicket({ subject, message, priority });
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />

      <CenteredHeader
        title={isCreating ? 'New Ticket' : 'Help & Support'}
        titleColor={colors.textPrimary}
        rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : isCreating ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.glassCard}>
              <View style={styles.infoBox}>
                <View style={[styles.infoIconWrap, { backgroundColor: colors.pink + '20' }]}>
                  <MaterialCommunityIcons name="information-outline" size={20} color={colors.pink} />
                </View>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Describe your issue below. Our team typically responds within 24 hours.
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Subject</Text>
                <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
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
                <View style={[styles.inputWrapper, styles.textAreaWrapper, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
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
            </GlassView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <GradientButton
              title="Submit Ticket"
              onPress={handleSubmit}
              loading={submitting}
              style={{ marginTop: Spacing.xl }}
              icon="send-outline"
            />
            <OutlinedButton
              title="Cancel"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsCreating(false);
              }}
              style={{ marginTop: Spacing.md }}
              textColor={colors.textMuted}
            />
          </Animated.View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {tickets.length === 0 ? (
            <Animated.View entering={FadeInDown} style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.pink + '10' }]}>
                <MaterialCommunityIcons name="lifebuoy" size={64} color={colors.pink} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>How can we help?</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                You have no open support tickets. Create one below if you need assistance.
              </Text>
            </Animated.View>
          ) : (
            tickets.map((ticket, index) => (
              <Animated.View
                key={ticket.ticket_id || ticket.id}
                entering={FadeInLeft.delay(index * 100).springify()}
                layout={Layout.springify()}
              >
                <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.ticketCard}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {ticket.subject || 'Support Ticket'}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status || 'open') + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(ticket.status || 'open') }]}>
                        {(ticket.status || 'open').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.cardMessage, { color: colors.textSecondary }]} numberOfLines={2}>
                    {ticket.message}
                  </Text>
                  <View style={styles.cardFooter}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.cardDate, { color: colors.textMuted }]}>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </GlassView>
              </Animated.View>
            ))
          )}

          <Animated.View entering={FadeInDown.delay(tickets.length * 100).springify()}>
            <GradientButton
              title="Create Ticket"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsCreating(true);
              }}
              style={{ marginTop: tickets.length === 0 ? Spacing.xl : Spacing.md }}
              icon="pencil-plus-outline"
            />
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 40 },

  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.4,
  },

  glassCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 64, 129, 0.08)', padding: Spacing.md,
    borderRadius: BorderRadius.lg, marginBottom: Spacing.xl, gap: Spacing.md
  },
  infoIconWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  infoText: { flex: 1, fontFamily: Fonts.medium, fontSize: 13, lineHeight: 20, opacity: 0.9 },

  formGroup: { marginBottom: Spacing.lg },
  label: { fontFamily: Fonts.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm, opacity: 0.6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, height: 54,
  },
  textAreaWrapper: { height: 140, alignItems: 'flex-start', paddingVertical: Spacing.sm },
  input: { flex: 1, fontFamily: Fonts.medium, fontSize: FontSizes.md },
  textArea: { height: 120 },

  ticketCard: {
    padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { flex: 1, fontFamily: Fonts.bold, fontSize: FontSizes.md, marginRight: Spacing.sm, letterSpacing: 0.5 },
  cardMessage: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginTop: 4, lineHeight: 20, opacity: 0.8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusText: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 0.5 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  cardDate: { fontFamily: Fonts.medium, fontSize: 11, opacity: 0.6 },

  emptyState: { alignItems: 'center', marginTop: 80, marginBottom: 40 },
  emptyIconWrap: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.xl, marginTop: Spacing.md },
  emptySubtitle: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginTop: 8, textAlign: 'center', opacity: 0.6, maxWidth: 260 },
});
