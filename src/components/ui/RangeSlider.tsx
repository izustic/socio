import { Colors, Radius } from "@/src/constants/theme";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

interface RangeSliderProps {
  value: [number, number];
  min: number;
  max: number;
  minDistance?: number;
  step?: number;
  onValueChange: (value: [number, number]) => void;
  style?: StyleProp<ViewStyle>;
}

type ActiveThumb = "min" | "max";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const roundToStep = (value: number, step: number) =>
  Math.round(value / step) * step;

export default function RangeSlider({
  value,
  min,
  max,
  minDistance = 1,
  step = 1,
  onValueChange,
  style,
}: RangeSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const activeThumb = useRef<ActiveThumb>("min");

  const leftPercent = useMemo(
    () => clamp(((value[0] - min) / (max - min)) * 100, 0, 100),
    [max, min, value],
  );
  const rightPercent = useMemo(
    () => clamp(((value[1] - min) / (max - min)) * 100, 0, 100),
    [max, min, value],
  );

  const updateFromLocation = useCallback(
    (locationX: number, mode: "start" | "move") => {
      if (!trackWidth) return;

      const ratio = clamp(locationX / trackWidth, 0, 1);
      const nextValue = clamp(
        roundToStep(min + ratio * (max - min), step),
        min,
        max,
      );

      if (mode === "start") {
        const distanceToMin = Math.abs(nextValue - value[0]);
        const distanceToMax = Math.abs(nextValue - value[1]);
        activeThumb.current = distanceToMin <= distanceToMax ? "min" : "max";
      }

      if (activeThumb.current === "min") {
        onValueChange([
          clamp(nextValue, min, value[1] - minDistance),
          value[1],
        ]);
        return;
      }

      onValueChange([
        value[0],
        clamp(nextValue, value[0] + minDistance, max),
      ]);
    },
    [max, min, minDistance, onValueChange, step, trackWidth, value],
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
        updateFromLocation(event.nativeEvent.locationX, "start")
      }
      onResponderMove={(event) =>
        updateFromLocation(event.nativeEvent.locationX, "move")
      }
    >
      <View
        style={[
          styles.fill,
          {
            left: `${leftPercent}%`,
            width: `${rightPercent - leftPercent}%`,
          },
        ]}
      />
      <View style={[styles.thumb, { left: `${leftPercent}%` }]} />
      <View style={[styles.thumb, { left: `${rightPercent}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 24,
    justifyContent: "center",
  },
  fill: {
    position: "absolute",
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
});
