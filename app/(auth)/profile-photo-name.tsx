import OnboardingLayout from '@/src/components/onboarding/OnboardingLayout';
import Input from '@/src/components/ui/Input';
import { useAuth } from '@/src/context/AuthContext';
import { Colors, Radius, Spacing, Typography } from '@/src/constants/theme';
import { useOnboarding } from '@/src/context/OnboardingContext';
import {
  pickProfileMedia,
  requestMediaLibraryPermission,
  uploadProfileMedia,
  UploadProgress,
} from '@/src/services/profileMedia';
import { ProfileMedia } from '@/src/types';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { tx } from "@/src/utils/localization";

const SLOT_COUNT = 5;

type SlotState = {
  stage: UploadProgress['stage'];
  progress: number;
};

export default function ProfilePhotoNameScreen() {
  const { user } = useAuth();
  const { draft, mergeDraft, setStep } = useOnboarding();
  const [slotStates, setSlotStates] = useState<Record<number, SlotState>>({});

  const mediaSlots = Array.from({ length: SLOT_COUNT }, (_, index) => draft.media[index] || null);

  const setSlotProgress = (slot: number, state: SlotState | null) => {
    setSlotStates((prev) => {
      if (!state) {
        const next = { ...prev };
        delete next[slot];
        return next;
      }
      return {
        ...prev,
        [slot]: state,
      };
    });
  };

  const upsertMedia = (slot: number, media: ProfileMedia) => {
    const nextMedia = [...draft.media];
    nextMedia[slot] = media;
    mergeDraft({
      media: nextMedia,
      photoURL: nextMedia[0]?.remoteUrl || media.remoteUrl,
    });
  };

  const handlePickMedia = async (slot: number) => {
    if (!user) {
      Alert.alert(tx("app.auth.profilePhotoName.notSignedIn"), tx("app.auth.profilePhotoName.pleaseSignInAgainBeforeUploadingMedia"));
      return;
    }

    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      Alert.alert(tx("app.auth.profilePhotoName.permissionNeeded"), tx("app.auth.profilePhotoName.pleaseAllowPhotoLibraryAccessToAddMedia"));
      return;
    }

    const result = await pickProfileMedia();
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];

    try {
      setSlotProgress(slot, { stage: 'picking', progress: 0 });
      const media = await uploadProfileMedia({
        userId: user.id,
        asset,
        slot,
        onProgress: (progress) => {
          setSlotProgress(slot, progress);
        },
      });
      upsertMedia(slot, media);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : tx("errors.uploadFile");
      Alert.alert(tx("app.auth.profilePhotoName.uploadFailed"), message);
    } finally {
      setSlotProgress(slot, null);
    }
  };

  const renderTile = (slot: number, large = false) => {
    const media = mediaSlots[slot];
    const slotState = slotStates[slot];
    const tileStyle = large ? styles.mainTile : styles.smallTile;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[tileStyle, !media && styles.emptyTile]}
        onPress={() => handlePickMedia(slot)}
      >
        {media ? (
          <>
            <Image source={{ uri: media.uri }} style={styles.mediaImage} contentFit="cover" />
            {media.type === 'video' ? (
              <View style={styles.videoBadge}>
                <Text style={styles.videoBadgeText}>{tx("app.auth.profilePhotoName.video")}</Text>
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.emptyContent}>
            <Text style={styles.plus}>+</Text>
          </View>
        )}

        {slot === 0 ? (
          <View style={styles.mainBadge}>
            <Text style={styles.mainBadgeText}>{tx("app.auth.profilePhotoName.main")}</Text>
          </View>
        ) : null}

        {slotState ? (
          <View style={styles.progressOverlay}>
            <Text style={styles.progressLabel}>
              {slotState.stage === 'compressing'
                ? tx("app.auth.profilePhotoName.compressing")
                : slotState.stage === 'uploading'
                  ? tx("app.auth.profilePhotoName.uploading")
                  : tx("app.auth.profilePhotoName.preparing")}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max(8, Math.round(slotState.progress * 100))}%` },
                ]}
              />
            </View>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <OnboardingLayout
      title={tx("app.auth.profilePhotoName.showWhoYouAre")}
      subtitle={tx("app.auth.profilePhotoName.addUpTo5PhotosOrShortVideosThe")}
      stepNumber={tx("onboarding.step.photoName")}
      primaryLabel={tx("app.auth.profilePhotoName.continue")}
      onPrimaryPress={() => {
        setStep('profile-age-gender');
      }}
      primaryDisabled={!draft.name.trim()}
      onBackPress={() => setStep('onboarding-intro')}
    >
      <View style={styles.mediaGrid}>
        {renderTile(0, true)}
        <View style={styles.sideColumn}>
          {renderTile(1)}
          {renderTile(2)}
        </View>
      </View>

      <View style={styles.bottomTiles}>
        {renderTile(3)}
        {renderTile(4)}
      </View>

      {/* <Text style={styles.helper}>
        Tap any dotted square to add a photo or short video. Videos over 25 MB will be compressed automatically.
      </Text> */}

      <View style={styles.section}>
        <Text style={styles.label}>{tx("app.auth.profilePhotoName.whatDoPeopleCallYou")}</Text>
        <Input
          placeholder={tx("app.auth.profilePhotoName.alex")}
          value={draft.name}
          onChangeText={(value) => mergeDraft({ name: value })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{tx("app.auth.profilePhotoName.shortBio")}</Text>
        <Input
          placeholder={tx("app.auth.profilePhotoName.sundayCoffeeBookstoreDatesEasyConversation")}
          value={draft.bio}
          onChangeText={(value) => mergeDraft({ bio: value })}
          multiline
          style={styles.bio}
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  mediaGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  mainTile: {
    flex: 1,
    height: 220,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mainBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mainBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sideColumn: {
    width: 100,
    gap: Spacing.sm,
  },
  smallTile: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bottomTiles: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  emptyTile: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: '#FFFDF7',
  },
  emptyContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    fontSize: 28,
    fontWeight: '500',
    color: Colors.primaryDark,
  },
  helper: {
    ...Typography.bodySmall,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  section: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.label,
  },
  bio: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  videoBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(26,26,26,0.72)',
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  videoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
  },
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,26,26,0.52)',
    justifyContent: 'flex-end',
    padding: 10,
  },
  progressLabel: {
    ...Typography.bodySmall,
    color: Colors.white,
    fontWeight: '700',
    marginBottom: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.24)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
});
