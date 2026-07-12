import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { tx } from "@/src/utils/localization";

interface CircleCapacityBadgeProps {
  current: number;
  max: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export default function CircleCapacityBadge({ 
  current, 
  max, 
  size = 'md',
  showProgress = false,
  variant = 'default'
}: CircleCapacityBadgeProps) {
  const percentage = Math.min((current / max) * 100, 100);
  const isFull = current >= max;
  const isAlmostFull = current >= max * 0.8;

  const getSize = () => {
    switch (size) {
      case 'sm': return { padding: 4, fontSize: 10, height: 20 };
      case 'md': return { padding: 6, fontSize: 12, height: 24 };
      case 'lg': return { padding: 8, fontSize: 14, height: 28 };
      default: return { padding: 6, fontSize: 12, height: 24 };
    }
  };

  const sizeConfig = getSize();
  const badgeColor = isFull ? Colors.success : isAlmostFull ? Colors.warning : Colors.primary;

  if (variant === 'compact') {
    return (
      <View style={[
        styles.compactContainer,
        { 
          backgroundColor: badgeColor,
          paddingHorizontal: sizeConfig.padding + 2,
          paddingVertical: 2,
          height: sizeConfig.height,
        }
      ]}>
        <Text style={[
          styles.compactText,
          { fontSize: sizeConfig.fontSize }
        ]}>
          {current}/{max}
        </Text>
      </View>
    );
  }

  if (variant === 'detailed') {
    return (
      <View style={styles.detailedContainer}>
        <View style={[
          styles.badge,
          { 
            backgroundColor: badgeColor,
            paddingVertical: sizeConfig.padding,
            paddingHorizontal: sizeConfig.padding + 4,
            height: sizeConfig.height,
          }
        ]}>
          <Text style={[
            styles.text,
            { fontSize: sizeConfig.fontSize }
          ]}>
            {current} / {max}
          </Text>
        </View>
        
        <View style={styles.details}>
          <Text style={styles.statusText}>
            {isFull ? tx("circle.CapacityBadge.full") : isAlmostFull ? tx("circle.CapacityBadge.almostFull") : tx("circle.CapacityBadge.open")}
          </Text>
          <Text style={styles.percentageText}>
            {Math.round(percentage)}{tx("circle.CapacityBadge.filled")}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { 
        paddingVertical: sizeConfig.padding,
        paddingHorizontal: sizeConfig.padding + 4,
        height: sizeConfig.height,
        backgroundColor: badgeColor,
      }
    ]}>
      <Text style={[
        styles.text,
        { fontSize: sizeConfig.fontSize }
      ]}>
        {current} / {max}
      </Text>
      {showProgress && (
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${percentage}%` }
            ]} 
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.pill,
    justifyContent: 'center',
    minWidth: 60,
    position: 'relative',
  },
  text: {
    ...Typography.button,
    color: '#fff',
    fontWeight: '700',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: Radius.pill,
  },
  compactContainer: {
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactText: {
    ...Typography.button,
    color: '#fff',
    fontWeight: '700',
  },
  detailedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    gap: 2,
  },
  statusText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  percentageText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
