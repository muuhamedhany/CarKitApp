import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/hooks/useTheme';
import { ProviderTabBar } from '@/components';
import { useTranslation } from '@/contexts/LanguageContext';

// iOS: NativeTabs
function IOSTabLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <NativeTabs
      backgroundColor={colors.backgroundSecondary}
      tintColor={colors.pink}
      iconColor={{
        default: colors.textMuted,
        selected: colors.pink,
      }}
      labelStyle={{
        default: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: 500,
        },
        selected: {
          color: colors.pink,
          fontSize: 11,
          fontWeight: 600,
        },
      }}
    >
      <NativeTabs.Trigger name="index">
        <Label>{t('tabs.dashboard')}</Label>
        <Icon
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="view-dashboard" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="services">
        <Label>{t('tabs.services')}</Label>
        <Icon
          sf={{ default: 'wrench', selected: 'wrench.fill' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="wrench" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="bookings">
        <Label>{t('tabs.bookings')}</Label>
        <Icon
          sf={{ default: 'calendar.badge.checkmark', selected: 'calendar.badge.checkmark' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="calendar-check" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>{t('tabs.profile')}</Label>
        <Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="account" />}
        />
      </NativeTabs.Trigger>

    </NativeTabs>
  );
}

// Android: Custom floating tab bar matching the design
function AndroidTabLayout() {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <ProviderTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: isDark ? '#050505' : '#F8F9FD' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.dashboard') }} />
      <Tabs.Screen name="services" options={{ title: t('tabs.services') }} />
      <Tabs.Screen name="bookings" options={{ title: t('tabs.bookings') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}

export default function ProviderTabLayout() {
  if (Platform.OS === 'ios') {
    return <IOSTabLayout />;
  }
  return <AndroidTabLayout />;
}
