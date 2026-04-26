import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/hooks/useTheme';
import { ProviderTabBar } from '@/components';

// iOS: NativeTabs
function IOSTabLayout() {
  const { colors } = useTheme();

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
        <Label>Dashboard</Label>
        <Icon
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="view-dashboard" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="services">
        <Label>Services</Label>
        <Icon
          sf={{ default: 'wrench', selected: 'wrench.fill' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="wrench" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="bookings">
        <Label>Bookings</Label>
        <Icon
          sf={{ default: 'calendar.badge.checkmark', selected: 'calendar.badge.checkmark' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="calendar-check" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
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
  return (
    <Tabs
      tabBar={(props) => <ProviderTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="services" options={{ title: 'Services' }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

export default function ProviderTabLayout() {
  if (Platform.OS === 'ios') {
    return <IOSTabLayout />;
  }
  return <AndroidTabLayout />;
}
