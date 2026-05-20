import { CustomTabBar } from '@/components';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

// iOS: Keep the NativeTabs exactly as before
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
        <Label>{t('tabs.home')}</Label>
        <Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="home" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search">
        <Label>{t('tabs.search')}</Label>
        <Icon
          sf="magnifyingglass"
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="magnify" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="cart">
        <Label>{t('tabs.cart')}</Label>
        <Icon
          sf={{ default: 'cart', selected: 'cart.fill' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="cart" />}
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
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: isDark ? '#050505' : '#F8F9FD' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="search" options={{ title: t('tabs.search') }} />
      <Tabs.Screen name="cart" options={{ title: t('tabs.cart') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}

export default function TabLayout() {
  if (Platform.OS === 'ios') {
    return <IOSTabLayout />;
  }
  return <AndroidTabLayout />;
}
