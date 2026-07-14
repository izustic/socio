import { createThemedStyles, Radius } from "@/src/constants/theme";
import React, { useCallback, useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

interface SingleSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
  style?: StyleProp<ViewStyle>;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const roundToStep = (value: number, step: number) =>
  Math.round(value / step) * step;

export default function SingleSlider({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  style,
}: SingleSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const percent = useMemo(
    () => clamp(((value - min) / (max - min)) * 100, 0, 100),
    [max, min, value],
  );

  const updateFromLocation = useCallback(
    (locationX: number) => {
      if (!trackWidth) return;

      const ratio = clamp(locationX / trackWidth, 0, 1);
      const nextValue = roundToStep(min + ratio * (max - min), step);
      onValueChange(clamp(nextValue, min, max));
    },
    [max, min, onValueChange, step, trackWidth],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      style={[styles.track, style]}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) =>
        updateFromLocation(event.nativeEvent.locationX)
      }
      onResponderMove={(event) => updateFromLocation(event.nativeEvent.locationX)}
    >
      <View style={[styles.fill, { width: `${percent}%` }]} />
      <View style={[styles.thumb, { left: `${percent}%` }]} />
    </View>
  );
}

const styles = createThemedStyles((Colors) => ({
  track: {
    height: 24,
    justifyContent: "center",
  },
  fill: {
    position: "absolute",
    left: 0,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  thumb: {
    position: "absolute",
    width: 20,
    height: 20,
    marginLeft: -10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
}));
