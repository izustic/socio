import React from 'react';
import { View, Text } from 'react-native';
import { createThemedStyles, Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { tx } from "@/src/utils/localization";

interface CircleProgressProps {
  current: number;
  max: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export default function CircleProgress({ 
  current, 
  max, 
  showLabel = true,
  showPercentage = true,
  height = 8,
  color = Colors.primary,
  backgroundColor = Colors.inputBg
}: CircleProgressProps) {
  const percentage = Math.min((current / max) * 100, 100);
  const isComplete = current >= max;

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{tx("circle.CircleProgress.circleProgress")}</Text>
          {showPercentage && (
            <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
          )}
        </View>
      )}
      
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressTrack,
            { height, backgroundColor }
          ]}
        >
          <View 
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
                height,
                backgroundColor: isComplete ? Colors.success : color,
              }
            ]}
          />
        </View>
        
        <View style={styles.countContainer}>
          <Text style={styles.count}>
            {current} / {max}
          </Text>
          <Text style={styles.status}>
            {isComplete ? tx("circle.CircleProgress.complete") : tx("circle.CircleProgress.value1SpotsLeft", { value1: max - current })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = createThemedStyles((Colors) => ({
  container: {
    gap: Spacing.sm,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
  },
  percentage: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  progressContainer: {
    gap: Spacing.xs,
  },
  progressTrack: {
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: Radius.pill,
  },
  countContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    ...Typography.body,
    fontWeight: '700',
  },
  status: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
}));
