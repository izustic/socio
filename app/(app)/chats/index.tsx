import Avatar from '@/src/components/ui/Avatar';
import Input from '@/src/components/ui/Input';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Chats() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Circle Chat</Text>
        <View style={styles.avatars}>
          <Avatar size="sm" placeholder />
          <Avatar size="sm" placeholder style={styles.avatarOverlap} />
          <Avatar size="sm" placeholder style={styles.avatarOverlap} />
        </View>
      </View>

      <View style={styles.messages}>
        <View style={styles.leftMessageRow}>
          <Avatar size="sm" placeholder />
          <View>
            <Text style={styles.senderName}>Alex</Text>
            <View style={styles.leftBubble}>
              <Text style={styles.leftBubbleText}>Hey everyone!</Text>
            </View>
          </View>
        </View>
        <View style={styles.rightBubble}>
          <Text style={styles.rightBubbleText}>Excited for the meetup.</Text>
        </View>
      </View>

      <View style={styles.inputRow}>
        <TouchableOpacity activeOpacity={0.7} style={styles.attachButton}>
          <Text>＋</Text>
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <Input placeholder="Type a message" />
        </View>
        <TouchableOpacity activeOpacity={0.7} style={styles.sendButton}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
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
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h3,
  },
  avatars: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  messages: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  leftMessageRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  leftBubble: {
    backgroundColor: Colors.inputBg,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '75%',
  },
  leftBubbleText: {
    ...Typography.body,
  },
  rightBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '75%',
  },
  rightBubbleText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    color: Colors.textPrimary,
  },
});