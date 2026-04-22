import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/hooks/useTheme';
import { VendorTabBar } from '@/components';

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

      <NativeTabs.Trigger name="products">
        <Label>Inventory</Label>
        <Icon
          sf={{ default: 'shippingbox', selected: 'shippingbox.fill' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="package-variant" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="orders">
        <Label>Orders</Label>
        <Icon
          sf={{ default: 'list.bullet.rectangle', selected: 'list.bullet.rectangle.fill' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="receipt-text" />}
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
      tabBar={(props) => <VendorTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="products" options={{ title: 'Products' }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics', href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  if (Platform.OS === 'ios') {
    return <IOSTabLayout />;
  }
  return <AndroidTabLayout />;
}
