import { PropsWithChildren } from 'react';
import { Alert, Pressable, PressableProps } from 'react-native';

type TooltipPressableProps = PropsWithChildren<
  PressableProps & {
    tooltip: string;
  }
>;

export function TooltipPressable({ tooltip, onLongPress, accessibilityHint, children, ...props }: TooltipPressableProps) {
  return (
    <Pressable
      accessibilityHint={accessibilityHint ?? tooltip}
      onLongPress={(event) => {
        Alert.alert('Подсказка', tooltip);
        onLongPress?.(event);
      }}
      {...props}
    >
      {children}
    </Pressable>
  );
}
