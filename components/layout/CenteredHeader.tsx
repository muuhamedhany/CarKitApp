import { Text, View, StyleSheet, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { Spacing, FontSizes, Fonts } from '@/constants/theme';
import BackButton from './BackButton';

type CenteredHeaderProps = {
    title: string;
    titleColor: string;
    rowStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    leftWidth?: number;
    rightWidth?: number;
};

export default function CenteredHeader({
    title,
    titleColor,
    rowStyle,
    titleStyle,
    leftWidth = 32,
    rightWidth = 32,
}: CenteredHeaderProps) {
    return (
        <>
            <BackButton noSpacer />
            <View style={[styles.header, rowStyle]}>
                <View style={{ width: leftWidth }} />
                <Text style={[styles.title, { color: titleColor }, titleStyle]} numberOfLines={1}>
                    {title}
                </Text>
                <View style={{ width: rightWidth }} />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    title: {
        flex: 1,
        textAlign: 'center',
        fontFamily: Fonts.bold,
        fontSize: FontSizes.xl,
    },
});