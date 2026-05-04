import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const handleCreateCircle = () => {
    router.push('/(app)/create-circle');
  };

  const handleJoinCircle = () => {
    // TODO: Navigate to join circle flow when implemented
    // For now, show a placeholder or navigate to explore
    router.push('/(tabs)/explore');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Socio</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="person-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo Circle */}
        <View style={styles.logoCircle}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>You don't have a Circle yet</Text>

        {/* Description */}
        <Text style={styles.description}>
          Start your own Circle, or join one created by someone who shares your vibe.
        </Text>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateCircle}>
            <Ionicons name="add" size={20} color={Colors.textPrimary} />
            <Text style={styles.createButtonText}>Create a Circle</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.joinButton} onPress={handleJoinCircle}>
            <Ionicons name="search" size={20} color={Colors.primary} />
            <Text style={styles.joinButtonText}>Join a Circle</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Text */}
        <Text style={styles.footer}>One active Circle at a time</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  logo: {
    ...Typography.h2,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF5E6', // Light orange background
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    lineHeight: 22,
  },
  buttons: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  createButton: {
    backgroundColor: Colors.primary, // Yellow button
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    gap: Spacing.sm,
  },
  createButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  joinButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    gap: Spacing.sm,
  },
  joinButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
  },
  footer: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
