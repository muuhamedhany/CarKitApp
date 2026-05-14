import React, { useEffect } from 'react';
import { TextInput, TextStyle, StyleSheet, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  useDerivedValue,
  Easing,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface CountUpProps {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  formatter?: (val: number) => string;
}

const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 2000,
  style,
  formatter = (val) => {
    'worklet';
    const num = Math.floor(val);
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },
}) => {
  const count = useSharedValue(0);

  useEffect(() => {
    count.value = withTiming(value, { 
      duration,
      easing: Easing.bezier(0.16, 1, 0.1, 1),
    });
  }, [value, duration]);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: formatter(count.value),
    } as any;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      value={formatter(value)}
      style={[styles.text, style]}
      animatedProps={animatedProps}
    />
  );
};

const styles = StyleSheet.create({
  text: {
    padding: 0,
    margin: 0,
    color: 'black', // Default, should be overridden by style prop
  },
});

export default CountUp;
