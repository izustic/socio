import React from 'react';
import { View, Text } from 'react-native';
import { createThemedStyles, Colors, Radius, Typography } from '@/src/constants/theme';

interface CapacityBadgeProps {
  current: number;
  max: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

export default function CapacityBadge({ 
  current, 
  max, 
  size = 'md',
  showProgress = true 
}: CapacityBadgeProps) {
  const percentage = Math.min((current / max) * 100, 100);
  const isFull = current >= max;

  const getSize = () => {
    switch (size) {
      case 'sm': return { padding: 4, fontSize: 10, height: 20 };
      case 'md': return { padding: 6, fontSize: 12, height: 24 };
      case 'lg': return { padding: 8, fontSize: 14, height: 28 };
      default: return { padding: 6, fontSize: 12, height: 24 };
    }
  };

  const sizeConfig = getSize();

  return (
    <View style={[
      styles.container,
      { 
        paddingVertical: sizeConfig.padding,
        paddingHorizontal: sizeConfig.padding + 4,
        height: sizeConfig.height,
        backgroundColor: isFull ? Colors.success : Colors.primary,
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

const styles = createThemedStyles((Colors) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.pill,
    justifyContent: 'center',
    minWidth: 60,
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
}));
