import { ViewStyle } from 'react-native';

export const rowDirection = (isRTL: boolean): ViewStyle['flexDirection'] => (isRTL ? 'row-reverse' : 'row');
export const textAlign = (isRTL: boolean) => (isRTL ? 'right' : 'left');
export const startAlign = (isRTL: boolean) => (isRTL ? 'flex-end' : 'flex-start');
export const endAlign = (isRTL: boolean) => (isRTL ? 'flex-start' : 'flex-end');
export const chevronForward = (isRTL: boolean) => (isRTL ? 'chevron-left' : 'chevron-right');
export const arrowForward = (isRTL: boolean) => (isRTL ? 'arrow-left' : 'arrow-right');
export const arrowBack = (isRTL: boolean) => (isRTL ? 'arrow-right' : 'arrow-left');
