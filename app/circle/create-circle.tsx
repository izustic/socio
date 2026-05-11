import Button from "@/src/components/ui/Button";
import Chip from "@/src/components/ui/Chip";
import Input from "@/src/components/ui/Input";
import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { createCircle } from "@/src/services/circle";
import { Interest } from "@/src/types";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const educationOptions = [
  "Any",
  "High School",
  "Bachelor's",
  "Master's",
  "PhD",
];
const interests = [
  "Music",
  "Travel",
  "Books",
  "Gaming",
  "Fitness",
  "Art",
  "Food",
  "Film",
];
const goals = ["Coffee ☕", "Study 📚", "Gym 💪", "Food 🍜", "Walk 🚶"];

export default function CreateCircleScreen() {
  const { user } = useAuth();
  const [circleName, setCircleName] = useState("");
  const [vibe, setVibe] = useState("");
  const [size, setSize] = useState(5);
  const [education, setEducation] = useState("Any");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState("Coffee ☕");
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const handleCreateCircle = async () => {
    if (!user) {
      Alert.alert("Not signed in", "Please sign in again to create a circle.");
      return;
    }
    if (!circleName.trim()) {
      Alert.alert("Missing Circle Name", "Please enter a circle name.");
      return;
    }
    if (selectedInterests.length === 0) {
      Alert.alert("Add Interests", "Please choose at least one interest.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: circleName.trim(),
        creatorId: user.id,
        size,
        ageRange: [18, 28],
        educationLevel: education,
        locationRadius: 10,
        interests: selectedInterests as Interest[],
        vibe: vibe.trim(),
        meetupGoal: selectedGoal,
        meetupTimeframe: "Within 3 days",
      };
      console.log("create circle payload:", payload);

      await createCircle(payload);

      router.replace("/circle/swipe-users");
    } catch (error: any) {
      Alert.alert(
        "Unable to create circle",
        error?.message || "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Create a Circle</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>CIRCLE NAME</Text>
          <Input
            placeholder="Circle Name"
            value={circleName}
            onChangeText={setCircleName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>VIBE / DESCRIPTION</Text>
          <Input
            placeholder="Tell people about your circle vibe"
            value={vibe}
            onChangeText={setVibe}
            multiline
            style={styles.multilineInput}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>CIRCLE SIZE</Text>
          <View style={styles.sizeRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.sizeButton}
              onPress={() => setSize((prev) => Math.max(3, prev - 1))}
            >
              <Text style={styles.sizeButtonText}>−</Text>
            </TouchableOpacity>
            <View style={styles.sizeValueWrap}>
              <Text style={styles.sizeValue}>{size}</Text>
              <Text style={styles.sizePeople}>people</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.sizeButton}
              onPress={() => setSize((prev) => Math.min(8, prev + 1))}
            >
              <Text style={styles.sizeButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>EDUCATION LEVEL</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalChips}
          >
            {educationOptions.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={education === option}
                onPress={() => setEducation(option)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>INTERESTS</Text>
          <View style={styles.grid}>
            {interests.map((interest) => (
              <Chip
                key={interest}
                label={interest}
                selected={selectedInterests.includes(interest)}
                onPress={() => toggleInterest(interest)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>MEETUP GOAL</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalChips}
          >
            {goals.map((goal) => (
              <Chip
                key={goal}
                label={goal}
                selected={selectedGoal === goal}
                onPress={() => setSelectedGoal(goal)}
              />
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={loading ? "Creating..." : "Create Circle"}
          onPress={handleCreateCircle}
          disabled={loading}
        />
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    ...Typography.h1,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.label,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  sizeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sizeButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeButtonText: {
    ...Typography.h2,
    lineHeight: 28,
  },
  sizeValueWrap: {
    alignItems: "center",
  },
  sizeValue: {
    ...Typography.h2,
    color: Colors.primary,
  },
  sizePeople: {
    ...Typography.bodySmall,
  },
  horizontalChips: {
    gap: Spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  footer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.background,
  },
});
