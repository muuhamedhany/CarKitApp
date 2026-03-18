import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <NativeTabs
      backgroundColor={Colors.backgroundSecondary}
      tintColor={Colors.pink}
      iconColor={{
        default: Colors.textMuted,
        selected: Colors.pink,
      }}
      labelStyle={{
        default: {
          color: Colors.textMuted,
          fontSize: 11,
          fontWeight: 500,
        },
        selected: {
          color: Colors.pink,
          fontSize: 11,
          fontWeight: 600,
        },
      }}
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="home" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search">
        <Label>Search</Label>
        <Icon
          sf="magnifyingglass"
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="magnify" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="cart">
        <Label>Cart</Label>
        <Icon
          sf={{ default: 'cart', selected: 'cart.fill' }}
          androidSrc={<VectorIcon family={MaterialCommunityIcons} name="cart" />}
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
