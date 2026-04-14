import { colors } from '@/src/constants/colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Chats() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chats Screen</Text>
      {/* TODO: List of circle chats */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
});