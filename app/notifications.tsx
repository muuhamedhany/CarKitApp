import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, FontSizes, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { GlassView, SecondaryButton, CenteredHeader } from '@/components';
import { notificationService, AppNotification } from '@/services/api/notification.service';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useToast } from '@/contexts/ToastContext';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Text from '@/components/common/LocalizedText';

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const swipeableRefs = useRef<Map<number, Swipeable>>(new Map());

  const fetchNotifications = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await notificationService.getAll();
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(false);
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications(prev => prev.map(n => 
          n.notification_id === id ? { ...n, is_read: true } : n
        ));
      }
    } catch (error) {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    if (notifications.length === 0) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        showToast('success', 'Success', 'All notifications marked as read.');
      }
    } catch (error) {
      showToast('error', 'Error', 'Failed to mark all as read.');
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const res = await notificationService.remove(id);
      if (res.success) {
        setNotifications(prev => prev.filter(n => n.notification_id !== id));
        showToast('success', 'Deleted', 'Notification removed.');
      }
    } catch (error) {
      showToast('error', 'Error', 'Failed to delete notification.');
    }
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    
    Alert.alert(
      "Clear All",
      "Are you sure you want to delete all notifications? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete All", 
          style: "destructive",
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              const res = await notificationService.clearAll();
              if (res.success) {
                setNotifications([]);
                showToast('success', 'Cleared', 'All notifications deleted.');
              }
            } catch (error) {
              showToast('error', 'Error', 'Failed to clear notifications.');
            }
          }
        }
      ]
    );
  };

  const handleNotificationPress = (notification: AppNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!notification.is_read) {
      handleMarkAsRead(notification.notification_id);
    }

    // Handle deep linking based on type
    if (notification.entity_type === 'order' && notification.entity_id) {
      router.push(`/order/${notification.entity_id}`);
    } else if (notification.entity_type === 'booking' && notification.entity_id) {
      router.push(`/booking/${notification.entity_id}`);
    } else if (notification.entity_type === 'emergency' || notification.entity_type === 'emergency_request') {
      router.push('/emergency-waiting');
    }
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'order': return 'package-variant-closed';
      case 'booking': return 'calendar-check';
      case 'emergency': return 'car-emergency';
      case 'alert': return 'alert-circle';
      case 'promo': return 'tag-heart';
      default: return 'bell';
    }
  };

  const getIconColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'order': return '#A855F7';
      case 'booking': return '#10B981';
      case 'emergency': return '#EF4444';
      case 'alert': return '#EF4444';
      case 'promo': return colors.pink;
      default: return colors.pink;
    }
  };

  const renderRightActions = (id: number) => {
    return (
      <Pressable 
        onPress={() => handleDeleteNotification(id)}
        style={styles.deleteAction}
      >
        <LinearGradient
          colors={['#EF4444', '#B91C1C']}
          style={styles.deleteGradient}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={28} color="white" />
          <Text style={styles.deleteText}>Delete</Text>
        </LinearGradient>
      </Pressable>
    );
  };

  const renderItem = ({ item, index }: { item: AppNotification; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(600)}>
      <Swipeable
        ref={ref => {
          if (ref) swipeableRefs.current.set(item.notification_id, ref);
        }}
        renderRightActions={() => renderRightActions(item.notification_id)}
        onSwipeableOpen={(direction) => {
          if (direction === 'right') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }}
      >
        <Pressable
          onPress={() => handleNotificationPress(item)}
          style={({ pressed }) => [
            styles.notificationItem,
            { opacity: pressed ? 0.9 : 1 }
          ]}
        >
          <GlassView 
            intensity={isDark ? 20 : 40} 
            tint={isDark ? 'dark' : 'light'} 
            style={[
              styles.notificationCard, 
              { borderColor: colors.cardBorder },
              !item.is_read && { borderColor: colors.pink + '50', backgroundColor: colors.pink + '05' }
            ]}
          >
            <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.type) + '15' }]}>
              <MaterialCommunityIcons name={getIcon(item.type) as any} size={24} color={getIconColor(item.type)} />
            </View>
            
            <View style={styles.textContainer}>
              <View style={styles.titleRow}>
                <Text style={[styles.notificationTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {item.title}
                </Text>
                {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: colors.pink }]} />}
              </View>
              <Text style={[styles.notificationBody, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={[styles.timeText, { color: colors.textMuted }]}>
                {new Date(item.created_at).toLocaleDateString('en-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </GlassView>
        </Pressable>
      </Swipeable>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      
      <CenteredHeader 
        title="Notifications" 
        titleColor={colors.textPrimary} 
        rightActions={[
          { icon: 'check-all', onPress: handleMarkAllRead },
          { icon: 'trash-can-outline', onPress: handleClearAll }
        ]}
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.notification_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.pink}
            colors={[colors.pink]}
            progressBackgroundColor={isDark ? colors.backgroundSecondary : '#FFFFFF'}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.center}>
              <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.emptyIconCircle}>
                <MaterialCommunityIcons name="bell-outline" size={48} color={colors.pink} />
              </GlassView>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Notifications Yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                When you get updates about your orders or bookings, they will show up here.
              </Text>
              <View style={{ marginTop: Spacing.xxl, width: 220 }}>
                <SecondaryButton title="Go Back" onPress={() => router.back()} />
              </View>
            </Animated.View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
    flexGrow: 1,
  },
  notificationItem: {
    marginBottom: Spacing.sm,
    backgroundColor: 'transparent',
  },
  notificationCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  notificationTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: Spacing.xs,
  },
  notificationBody: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    lineHeight: 18,
    marginBottom: 4,
  },
  timeText: {
    fontFamily: Fonts.regular,
    fontSize: 10,
  },
  deleteAction: {
    width: 80,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  deleteGradient: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: 'white',
    fontFamily: Fonts.bold,
    fontSize: 10,
    marginTop: 4,
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.xl,
    marginTop: 100,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyTitle: { 
    fontFamily: Fonts.extraBold, 
    fontSize: FontSizes.xl, 
    marginTop: Spacing.md,
    letterSpacing: -0.5
  },
  emptySubtitle: { 
    fontFamily: Fonts.medium, 
    fontSize: FontSizes.md, 
    marginTop: 10, 
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.6,
  },
});
