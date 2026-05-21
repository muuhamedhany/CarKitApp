import React from 'react';
import {
  StyleSheet,
  TextInput as RNTextInput,
  type TextInputProps,
} from 'react-native';

import { useTranslation } from '@/contexts/LanguageContext';

const LocalizedTextInput = React.forwardRef<RNTextInput, TextInputProps>(
  ({ placeholder, style, ...props }, ref) => {
    const { t, isRTL } = useTranslation();
    const flattenedStyle = StyleSheet.flatten(style);
    const directionStyle = {
      writingDirection: isRTL ? 'rtl' : 'ltr',
      textAlign: flattenedStyle?.textAlign ?? (isRTL ? 'right' : 'left'),
    } as const;

    return (
      <RNTextInput
        ref={ref}
        {...props}
        placeholder={placeholder ? t(placeholder) : placeholder}
        style={[directionStyle, style]}
      />
    );
  }
);

LocalizedTextInput.displayName = 'LocalizedTextInput';

export default LocalizedTextInput;
