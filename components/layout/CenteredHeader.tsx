import { Platform, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSizes, Fonts, Spacing } from '@/constants/theme';
import BackButton from './BackButton';

type CenteredHeaderProps = {
    title: string;
    titleColor: string;
    rowStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
};

export default function CenteredHeader({
    title,
    titleColor,
    rowStyle,
    titleStyle,
}: CenteredHeaderProps) {
    const insets = useSafeAreaInsets();

    // Calculate default padding to align perfectly with the BackButton icon center
    const defaultPaddingTop = Platform.OS === 'android' ? insets.top + 23 : insets.top + 19;

    return (
        <>
            <BackButton noSpacer />
            <View style={[
                styles.header,
                { paddingTop: defaultPaddingTop },
                rowStyle
            ]}>
                <Text style={[styles.title, { color: titleColor }, titleStyle]} numberOfLines={1}>
                    {title}
                </Text>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: Spacing.sm,
        marginTop: 0, // Removed to allow precise alignment with paddingTop
        paddingHorizontal: 48,
    },
    title: {
        textAlign: 'center',
        fontFamily: Fonts.extraBold,
        fontSize: FontSizes.xl,
        letterSpacing: -0.5,
    },
});
