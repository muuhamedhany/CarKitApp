import { View } from 'react-native';
import { Stack } from 'expo-router';

type BackButtonProps = {
  // OS natively handles the back action when using the native header
  onPress?: () => void;
  noSpacer?: boolean;
};

export default function BackButton({ onPress, noSpacer }: BackButtonProps) {
  // By rendering Stack.Screen options dynamically here, we tell the
  // Expo Router / React Navigation stack to enable the purely native
  // iOS navigation header (UINavigationController).
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true, // Overlays instead of pushing content down
          headerTitle: '',         // Hides the title next to the back button
          // @ts-ignore: React Navigation validates this, but Expo Router types can occasionally drop it
          headerBackTitleVisible: false, // Forcefully hides previous route name (e.g. "(tabs)")
          headerTintColor: '#ffffff', // Dark theme matching
        }}
      />
      {/* 
        This transparent spacer prevents screen content from jumping upward 
        into the Native Header area, preserving pixel layout.
      */}
      {!noSpacer && <View style={{ height: 48 }} />}
    </>
  );
}
