import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';

import { useTranslation } from '@/contexts/LanguageContext';

const translateChild = (child: React.ReactNode, t: (key: string) => string): React.ReactNode => {
  if (typeof child === 'string') {
    return child.trim().length > 0 ? t(child) : child;
  }

  if (Array.isArray(child)) {
    return child.map((item, index) => (
      <React.Fragment key={index}>{translateChild(item, t)}</React.Fragment>
    ));
  }

  return child;
};

export default function LocalizedText({ children, ...props }: TextProps) {
  const { t } = useTranslation();

  return (
    <RNText {...props}>
      {translateChild(children, t)}
    </RNText>
  );
}
