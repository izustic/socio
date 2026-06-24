import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import React from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type AlertModalProps = {
  visible: boolean;
  title: string;
  message: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  imageUri?: string;
  detail?: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

export default function AlertModal({
  visible,
  title,
  message,
  primaryLabel = "OK",
  secondaryLabel,
  imageUri,
  detail,
  onConfirm,
  onCancel,
}: AlertModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel ?? onConfirm}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : null}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {detail ? <Text style={styles.detail}>{detail}</Text> : null}

          <View style={styles.actions}>
            {secondaryLabel ? (
              <TouchableOpacity
                activeOpacity={0.82}
                style={[styles.button, styles.secondaryButton]}
                onPress={onCancel}
              >
                <Text style={[styles.buttonText, styles.secondaryText]}>
                  {secondaryLabel}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              activeOpacity={0.82}
              style={[styles.button, styles.primaryButton]}
              onPress={onConfirm}
            >
              <Text style={[styles.buttonText, styles.primaryText]}>
                {primaryLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.screenPadding,
  },
  dialog: {
    width: "100%",
    maxWidth: 432,
    borderRadius: Radius.xl,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: "center",
    shadowColor: "rgba(0,0,0,0.15)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    ...Typography.h2,
    fontSize: 24,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  image: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    backgroundColor: Colors.placeholder,
    marginBottom: Spacing.md,
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.lg,
    maxWidth: 320,
  },
  detail: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: -Spacing.md,
    marginBottom: Spacing.lg,
    maxWidth: 320,
  },
  actions: {
    width: "100%",
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
  },
  button: {
    flex: 1,
    minHeight: 56,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonText: {
    ...Typography.button,
    fontWeight: "700",
  },
  primaryText: {
    color: Colors.white,
  },
  secondaryText: {
    color: Colors.textPrimary,
  },
});
