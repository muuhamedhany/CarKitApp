import { Platform, StyleSheet, Text, View, Pressable, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSizes, Fonts, Spacing } from '@/constants/theme';
import BackButton from './BackButton';

type HeaderAction = {
    icon: string;
    onPress: () => void | Promise<void>;
};

type CenteredHeaderProps = {
    title: string;
    titleColor: string;
    rowStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    rightIcon?: string;
    onRightPress?: () => void | Promise<void>;
    rightActions?: HeaderAction[];
};

export default function CenteredHeader({
    title,
    titleColor,
    rowStyle,
    titleStyle,
    rightIcon,
    onRightPress,
    rightActions,
}: CenteredHeaderProps) {
    const insets = useSafeAreaInsets();

    // Calculate default padding to align perfectly with the BackButton icon center
    const defaultPaddingTop = Platform.OS === 'android' ? insets.top + 23 : insets.top + 19;

    const actions = rightActions || (rightIcon && onRightPress ? [{ icon: rightIcon, onPress: onRightPress }] : []);

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

                <View style={styles.rightActionsContainer}>
                    {actions.map((action, index) => (
                        <Pressable 
                            key={index}
                            onPress={action.onPress}
                            style={({ pressed }) => [
                                styles.rightButton,
                                { opacity: pressed ? 0.7 : 1 }
                            ]}
                        >
                            <MaterialCommunityIcons name={action.icon as any} size={24} color={titleColor} />
                        </Pressable>
                    ))}
                </View>
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
        flex: 1,
    },
    rightActionsContainer: {
        position: 'absolute',
        right: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
