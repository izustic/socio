import React from 'react';
import { View, Text } from 'react-native';
import { createThemedStyles, Spacing, Typography } from '@/src/constants/theme';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export default function StepIndicator({ 
  currentStep, 
  totalSteps, 
  labels 
}: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stepsContainer}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <React.Fragment key={index}>
              <View style={[
                styles.step,
                isActive && styles.stepActive,
                isCompleted && styles.stepCompleted
              ]}>
                <Text style={[
                  styles.stepText,
                  (isActive || isCompleted) && styles.stepTextActive
                ]}>
                  {isCompleted ? '✓' : stepNumber}
                </Text>
              </View>
              
              {index < totalSteps - 1 && (
                <View style={[
                  styles.connector,
                  isCompleted && styles.connectorCompleted
                ]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
      
      {labels && (
        <View style={styles.labelsContainer}>
          {labels.map((label, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            
            return (
              <Text
                key={index}
                style={[
                  styles.label,
                  (isActive || isCompleted) && styles.labelActive
                ]}
              >
                {label}
              </Text>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = createThemedStyles((Colors) => ({
  container: {
    alignItems: 'center',
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  step: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.inputBg,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepText: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  stepTextActive: {
    color: '#fff',
  },
  connector: {
    width: 20,
    height: 2,
    backgroundColor: Colors.border,
  },
  connectorCompleted: {
    backgroundColor: Colors.primary,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: Spacing.sm,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    flex: 1,
  },
  labelActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
}));
