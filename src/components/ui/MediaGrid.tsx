import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
}

interface MediaGridProps {
  items: MediaItem[];
  maxItems?: number;
  editable?: boolean;
  onAddPress?: () => void;
  onRemovePress?: (index: number) => void;
  onItemPress?: (index: number) => void;
}

export default function MediaGrid({ 
  items, 
  maxItems = 5,
  editable = false,
  onAddPress,
  onRemovePress,
  onItemPress
}: MediaGridProps) {
  const displayItems = items.slice(0, maxItems);
  const showAddButton = editable && items.length < maxItems;

  const renderMediaItem = (item: MediaItem, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.mediaItem}
      onPress={() => onItemPress?.(index)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.uri }}
        style={styles.mediaImage}
        contentFit="cover"
      />
      {item.type === 'video' && (
        <View style={styles.videoOverlay}>
          <Text style={styles.videoIcon}>▶</Text>
        </View>
      )}
      {editable && onRemovePress && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemovePress(index)}
        >
          <Text style={styles.removeIcon}>×</Text>
        </TouchableOpacity>
      )}
      {index === 0 && (
        <View style={styles.mainBadge}>
          <Text style={styles.mainBadgeText}>MAIN</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderAddButton = () => (
    <TouchableOpacity
      style={styles.addItem}
      onPress={onAddPress}
      activeOpacity={0.8}
    >
      <Text style={styles.addIcon}>+</Text>
      <Text style={styles.addText}>Add</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {displayItems.map(renderMediaItem)}
      {showAddButton && renderAddButton()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  mediaItem: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIcon: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  mainBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  mainBadgeText: {
    ...Typography.bodySmall,
    fontSize: 8,
    color: '#fff',
    fontWeight: '700',
  },
  addItem: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    backgroundColor: Colors.inputBg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontWeight: '300',
  },
  addText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
});
