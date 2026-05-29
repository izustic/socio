import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import {
  BarChart2,
  Check,
  ChevronDown,
  Clock,
  Plus,
  Users,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type DimensionValue,
} from "react-native";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // array of voter userIds
}

export interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  expiresAt?: Date | null;
  createdBy: string;
  createdAt: Date;
}

// ─────────────────────────────────────────────
// PollCreator Modal
// ─────────────────────────────────────────────

interface PollCreatorProps {
  visible: boolean;
  onClose: () => void;
  onCreatePoll: (poll: Omit<PollData, "id" | "createdAt">) => void;
  currentUserId: string;
}

const EXPIRY_OPTIONS = [
  { label: "No expiry", value: null },
  { label: "1 hour", value: 60 },
  { label: "6 hours", value: 360 },
  { label: "24 hours", value: 1440 },
  { label: "3 days", value: 4320 },
  { label: "7 days", value: 10080 },
];

export function PollCreator({
  visible,
  onClose,
  onCreatePoll,
  currentUserId,
}: PollCreatorProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [expiryMinutes, setExpiryMinutes] = useState<number | null>(null);
  const [showExpiryPicker, setShowExpiryPicker] = useState(false);

  const reset = () => {
    setQuestion("");
    setOptions(["", ""]);
    setAllowMultiple(false);
    setExpiryMinutes(null);
    setShowExpiryPicker(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const addOption = () => {
    if (options.length < 10) setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, text: string) => {
    const updated = [...options];
    updated[index] = text;
    setOptions(updated);
  };

  const canSubmit =
    question.trim().length > 0 &&
    options.filter((o) => o.trim().length > 0).length >= 2;

  const handleCreate = () => {
    const validOptions = options
      .filter((o) => o.trim().length > 0)
      .map((o, i) => ({
        id: `opt-${Date.now()}-${i}`,
        text: o.trim(),
        votes: [],
      }));

    const expiresAt = expiryMinutes
      ? new Date(Date.now() + expiryMinutes * 60 * 1000)
      : null;

    onCreatePoll({
      question: question.trim(),
      options: validOptions,
      allowMultiple,
      expiresAt,
      createdBy: currentUserId,
    });

    reset();
    onClose();
  };

  const selectedExpiry = EXPIRY_OPTIONS.find((o) => o.value === expiryMinutes);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={creator.container}>
        {/* Header */}
        <View style={creator.header}>
          <TouchableOpacity onPress={handleClose} style={creator.headerButton}>
            <X size={22} color={Colors.textSecondary} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={creator.headerTitle}>New poll</Text>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={!canSubmit}
            style={[
              creator.createButton,
              !canSubmit && creator.createButtonDisabled,
            ]}
          >
            <Text
              style={[
                creator.createButtonText,
                !canSubmit && creator.createButtonTextDisabled,
              ]}
            >
              Create
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={creator.scroll}
          contentContainerStyle={creator.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Question */}
          <View style={creator.section}>
            <Text style={creator.sectionLabel}>Question</Text>
            <TextInput
              style={creator.questionInput}
              value={question}
              onChangeText={setQuestion}
              placeholder="Ask something..."
              placeholderTextColor={Colors.textDisabled}
              maxLength={200}
              multiline
            />
          </View>

          {/* Options */}
          <View style={creator.section}>
            <Text style={creator.sectionLabel}>Options</Text>
            <View style={creator.optionsList}>
              {options.map((opt, index) => (
                <View key={index} style={creator.optionRow}>
                  <View style={creator.optionBullet}>
                    <Text style={creator.optionBulletText}>{index + 1}</Text>
                  </View>
                  <TextInput
                    style={creator.optionInput}
                    value={opt}
                    onChangeText={(text) => updateOption(index, text)}
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor={Colors.textDisabled}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <TouchableOpacity
                      onPress={() => removeOption(index)}
                      style={creator.removeOptionButton}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X
                        size={16}
                        color={Colors.textSecondary}
                        strokeWidth={2.2}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {options.length < 10 && (
              <TouchableOpacity
                style={creator.addOptionButton}
                onPress={addOption}
              >
                <Plus size={16} color={Colors.primary} strokeWidth={2.4} />
                <Text style={creator.addOptionText}>Add option</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Settings */}
          <View style={creator.section}>
            <Text style={creator.sectionLabel}>Settings</Text>

            <View style={creator.settingRow}>
              <View style={creator.settingLeft}>
                <Users size={18} color={Colors.textSecondary} strokeWidth={2} />
                <Text style={creator.settingLabel}>Multiple choice</Text>
              </View>
              <Switch
                value={allowMultiple}
                onValueChange={setAllowMultiple}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={[creator.settingRow, { borderBottomWidth: 0 }]}>
              <View style={creator.settingLeft}>
                <Clock size={18} color={Colors.textSecondary} strokeWidth={2} />
                <Text style={creator.settingLabel}>Poll duration</Text>
              </View>
              <TouchableOpacity
                style={creator.expirySelector}
                onPress={() => setShowExpiryPicker(!showExpiryPicker)}
              >
                <Text style={creator.expirySelectorText}>
                  {selectedExpiry?.label ?? "No expiry"}
                </Text>
                <ChevronDown
                  size={14}
                  color={Colors.textSecondary}
                  strokeWidth={2.2}
                />
              </TouchableOpacity>
            </View>

            {showExpiryPicker && (
              <View style={creator.expiryOptions}>
                {EXPIRY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={creator.expiryOption}
                    onPress={() => {
                      setExpiryMinutes(opt.value);
                      setShowExpiryPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        creator.expiryOptionText,
                        expiryMinutes === opt.value &&
                          creator.expiryOptionTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {expiryMinutes === opt.value && (
                      <Check
                        size={15}
                        color={Colors.primary}
                        strokeWidth={2.4}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// PollMessage Component
// ─────────────────────────────────────────────

interface PollMessageProps {
  poll: PollData;
  currentUserId: string;
  onVote: (pollId: string, optionIds: string[]) => void;
  isOwn?: boolean;
}

export function PollMessage({
  poll,
  currentUserId,
  onVote,
  isOwn = false,
}: PollMessageProps) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);

  const userVotedOptionIds = poll.options
    .filter((o) => o.votes.includes(currentUserId))
    .map((o) => o.id);

  const hasVoted = userVotedOptionIds.length > 0;

  const isExpired = poll.expiresAt
    ? new Date() > new Date(poll.expiresAt)
    : false;
  const showResults = hasVoted || isExpired;

  const [pendingVotes, setPendingVotes] =
    useState<string[]>(userVotedOptionIds);

  const toggleOption = (optionId: string) => {
    if (isExpired) return;

    if (poll.allowMultiple) {
      setPendingVotes((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    } else {
      setPendingVotes([optionId]);
      onVote(poll.id, [optionId]);
    }
  };

  const submitVote = () => {
    if (pendingVotes.length > 0) {
      onVote(poll.id, pendingVotes);
    }
  };

  const formatExpiry = (date: Date) => {
    const diff = new Date(date).getTime() - Date.now();
    if (diff <= 0) return "Ended";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours >= 24) return `${Math.floor(hours / 24)}d left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const getBarWidth = (votes: number): DimensionValue => {
    if (totalVotes === 0) return 0;
    return `${Math.round((votes / totalVotes) * 100)}%` as `${number}%`;
  };

  const getVoterNames = (option: PollOption) => {
    if (option.votes.length === 0) return null;
    const names = option.votes
      .slice(0, 3)
      .map((id) => (id === currentUserId ? "You" : id))
      .join(", ");
    const extra = option.votes.length > 3 ? ` +${option.votes.length - 3}` : "";
    return names + extra;
  };

  return (
    <View style={[poll_styles.wrapper, isOwn && poll_styles.ownWrapper]}>
      {/* Poll header */}
      <View style={poll_styles.header}>
        <BarChart2 size={16} color={Colors.primary} strokeWidth={2.2} />
        <Text style={poll_styles.pollLabel}>Poll</Text>
        {isExpired && (
          <View style={poll_styles.endedBadge}>
            <Text style={poll_styles.endedBadgeText}>Ended</Text>
          </View>
        )}
      </View>

      {/* Question */}
      <Text style={poll_styles.question}>{poll.question}</Text>

      {/* Options */}
      <View style={poll_styles.options}>
        {poll.options.map((option) => {
          const isSelected = pendingVotes.includes(option.id);
          const voteCount = option.votes.length;
          const percentage =
            totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const voterNames = getVoterNames(option);

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                poll_styles.option,
                isSelected && poll_styles.optionSelected,
                (isExpired || (hasVoted && !poll.allowMultiple)) &&
                  poll_styles.optionDisabled,
              ]}
              onPress={() => toggleOption(option.id)}
              activeOpacity={isExpired ? 1 : 0.75}
              disabled={isExpired}
            >
              {showResults && (
                <View
                  style={[
                    poll_styles.optionBar,
                    isSelected && poll_styles.optionBarSelected,
                    { width: getBarWidth(voteCount) },
                  ]}
                />
              )}

              <View style={poll_styles.optionContent}>
                <View style={poll_styles.optionLeft}>
                  {!showResults ? (
                    <View
                      style={[
                        poll.allowMultiple
                          ? poll_styles.checkbox
                          : poll_styles.radio,
                        isSelected &&
                          (poll.allowMultiple
                            ? poll_styles.checkboxSelected
                            : poll_styles.radioSelected),
                      ]}
                    >
                      {isSelected &&
                        (poll.allowMultiple ? (
                          <Check
                            size={11}
                            color={Colors.white}
                            strokeWidth={3}
                          />
                        ) : (
                          <View style={poll_styles.radioDot} />
                        ))}
                    </View>
                  ) : (
                    isSelected && (
                      <Check
                        size={14}
                        color={Colors.primary}
                        strokeWidth={2.8}
                      />
                    )
                  )}
                  <View style={poll_styles.optionTextGroup}>
                    <Text
                      style={[
                        poll_styles.optionText,
                        isSelected && poll_styles.optionTextSelected,
                      ]}
                    >
                      {option.text}
                    </Text>
                    {showResults && voterNames && (
                      <Text style={poll_styles.voterNames} numberOfLines={1}>
                        {voterNames}
                      </Text>
                    )}
                  </View>
                </View>

                {showResults && (
                  <Text
                    style={[
                      poll_styles.percentage,
                      isSelected && poll_styles.percentageSelected,
                    ]}
                  >
                    {percentage}%
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Submit button for multiple choice */}
      {poll.allowMultiple && !isExpired && !hasVoted && (
        <TouchableOpacity
          style={[
            poll_styles.voteButton,
            pendingVotes.length === 0 && poll_styles.voteButtonDisabled,
          ]}
          onPress={submitVote}
          disabled={pendingVotes.length === 0}
        >
          <Text
            style={[
              poll_styles.voteButtonText,
              pendingVotes.length === 0 && poll_styles.voteButtonTextDisabled,
            ]}
          >
            Vote
          </Text>
        </TouchableOpacity>
      )}

      {/* Footer */}
      <View style={poll_styles.footer}>
        <Text style={poll_styles.footerText}>
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        </Text>
        {poll.expiresAt && !isExpired && (
          <>
            <View style={poll_styles.footerDot} />
            <Clock size={12} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={poll_styles.footerText}>
              {formatExpiry(new Date(poll.expiresAt))}
            </Text>
          </>
        )}
        {poll.allowMultiple && (
          <>
            <View style={poll_styles.footerDot} />
            <Text style={poll_styles.footerText}>Multiple choice</Text>
          </>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// PollCreator Styles
// ─────────────────────────────────────────────

const creator = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  createButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  createButtonDisabled: {
    backgroundColor: Colors.inputBg,
  },
  createButtonText: {
    ...Typography.bodySmall,
    fontWeight: "700",
    color: Colors.white,
  },
  createButtonTextDisabled: {
    color: Colors.textDisabled,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.bodySmall,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  questionInput: {
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 56,
    textAlignVertical: "top",
  },
  optionsList: {
    gap: Spacing.sm,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    paddingRight: Spacing.sm,
  },
  optionBullet: {
    width: 36,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  optionBulletText: {
    ...Typography.bodySmall,
    color: Colors.textDisabled,
    fontWeight: "700",
  },
  optionInput: {
    ...Typography.body,
    flex: 1,
    color: Colors.textPrimary,
    height: 44,
  },
  removeOptionButton: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  addOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  addOptionText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  settingLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  expirySelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  expirySelectorText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: "600",
  },
  expiryOptions: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    overflow: "hidden",
    marginTop: Spacing.xs,
  },
  expiryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  expiryOptionText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  expiryOptionTextSelected: {
    color: Colors.primary,
    fontWeight: "700",
  },
});

// ─────────────────────────────────────────────
// PollMessage Styles
// ─────────────────────────────────────────────

const poll_styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    minWidth: 260,
    maxWidth: 320,
  },
  ownWrapper: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryLight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pollLabel: {
    ...Typography.bodySmall,
    fontWeight: "700",
    color: Colors.primary,
    flex: 1,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  endedBadge: {
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  endedBadgeText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: "600",
    fontSize: 10,
  },
  question: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  options: {
    gap: 6,
    marginTop: 2,
  },
  option: {
    borderRadius: Radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minHeight: 44,
    justifyContent: "center",
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight ?? "#F0F4FF",
  },
  optionDisabled: {
    opacity: 0.95,
  },
  optionBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
  },
  optionBarSelected: {
    backgroundColor: `${Colors.primary}22`,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: Spacing.sm,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  optionTextGroup: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  optionText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  optionTextSelected: {
    color: Colors.primaryDark ?? Colors.primary,
    fontWeight: "600",
  },
  voterNames: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  percentage: {
    ...Typography.bodySmall,
    fontWeight: "700",
    color: Colors.textSecondary,
    fontSize: 13,
    minWidth: 36,
    textAlign: "right",
  },
  percentageSelected: {
    color: Colors.primary,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },
  checkboxSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  voteButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    marginTop: 4,
  },
  voteButtonDisabled: {
    backgroundColor: Colors.inputBg,
  },
  voteButtonText: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.white,
  },
  voteButtonTextDisabled: {
    color: Colors.textDisabled,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  footerText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textDisabled,
  },
});
