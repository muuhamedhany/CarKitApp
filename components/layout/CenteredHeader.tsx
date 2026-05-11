import { Text, View, StyleSheet, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { Spacing, FontSizes, Fonts } from '@/constants/theme';
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
    return (
        <>
            <BackButton noSpacer />
            <View style={[styles.header, rowStyle]}>
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
        paddingBottom: Spacing.sm,
        marginTop: Spacing.sm,
    },
    title: {
        textAlign: 'left',
        fontFamily: Fonts.bold,
        fontSize: FontSizes.xl,
    },
});