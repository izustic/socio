import { Stack } from 'expo-router';

export default function ModeratorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="report-detail" />
    </Stack>
  );
}