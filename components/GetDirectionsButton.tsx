import { useCallback } from 'react';
import {
    Linking,
    Platform,
    StyleSheet,
    Pressable,
    Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';

interface GetDirectionsButtonProps {
    latitude: number;
    longitude: number;
    /** Optional label for the pin in the map app */
    label?: string;
}

/**
 * A button that opens the native map application (Apple Maps on iOS, Google Maps on Android)
 * for navigation to the specified coordinates.
 */
export default function GetDirectionsButton({
    latitude,
    longitude,
    label = 'Service Location',
}: GetDirectionsButtonProps) {
    const { colors } = useTheme();

    const openInMaps = useCallback(() => {
        let url: string;

        if (Platform.OS === 'ios') {
            // Apple Maps with fallback
            url = `maps:0,0?q=${latitude},${longitude}(${label})`;
        } else {
            // Google Maps on Android (and fallback for web)
            url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        }

        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
                }
            })
            .catch(() => {
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
            });
    }, [latitude, longitude, label]);

    return (
        <Pressable
            onPress={openInMaps}
            style={({ pressed }) => [
                styles.button,
                {
                    borderColor: colors.pink,
                    backgroundColor: pressed ? colors.pink + '10' : 'transparent',
                },
            ]}
        >
            <MaterialCommunityIcons name="navigation-variant-outline" size={20} color={colors.pink} />
            <Text style={[styles.text, { color: colors.pink }]}>Get Directions</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        marginTop: Spacing.md,
        height: 48,
        borderRadius: BorderRadius.full,
        borderWidth: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    text: {
        fontSize: FontSizes.md,
        fontFamily: Fonts.bold,
    },
});
