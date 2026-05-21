import React from 'react';
import { StyleSheet, Text as RNText, type TextProps } from 'react-native';

import { useTranslation } from '@/contexts/LanguageContext';

const translateChild = (child: React.ReactNode, t: (key: string) => string): React.ReactNode => {
  if (typeof child === 'string') {
    const trimmed = child.trim();
    if (!trimmed) return child;

    const leading = child.match(/^\s*/)?.[0] ?? '';
    const trailing = child.match(/\s*$/)?.[0] ?? '';
    return `${leading}${t(trimmed)}${trailing}`;
  }

  if (Array.isArray(child)) {
    return child.map((item, index) => (
      <React.Fragment key={index}>{translateChild(item, t)}</React.Fragment>
    ));
  }

  return child;
};

export default function LocalizedText({ children, ...props }: TextProps) {
  const { t, isRTL } = useTranslation();
  const flattenedStyle = StyleSheet.flatten(props.style);
  const directionStyle = {
    writingDirection: isRTL ? 'rtl' : 'ltr',
    textAlign: flattenedStyle?.textAlign ?? (isRTL ? 'right' : 'left'),
  } as const;

  return (
    <RNText {...props} style={[directionStyle, props.style]}>
      {translateChild(children, t)}
    </RNText>
  );
}
