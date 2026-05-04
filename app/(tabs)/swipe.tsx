import { Colors, Spacing, Typography } from '@/src/constants/theme';
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';

export default function TabTwoScreen() {
  const notifications = [
    { icon: '👤', title: 'New match in your circle', sub: 'Maya joined your circle', time: '2m', unread: true },
    { icon: '⭕', title: 'Circle is almost full', sub: 'You need 1 more member', time: '1h', unread: true },
    { icon: '⏰', title: 'Meetup reminder', sub: 'Your meetup is in 2 days', time: 'Yesterday', unread: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>Notifications</Text>
      <View style={styles.list}>
        {notifications.map((item) => (
          <View key={item.title} style={styles.item}>
            <View style={[styles.dot, !item.unread && styles.readDot]} />
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={styles.body}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSub}>{item.sub}</Text>
            </View>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  title: {
    ...Typography.h1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: Spacing.sm,
  },
  readDot: {
    opacity: 0,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    ...Typography.body,
    fontWeight: '700',
  },
  itemSub: {
    ...Typography.bodySmall,
  },
  time: {
    ...Typography.bodySmall,
  },
});
