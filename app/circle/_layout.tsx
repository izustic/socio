import { Stack } from 'expo-router';

export default function CircleLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Circle flow screens */}
      <Stack.Screen name="no-circle" />
      <Stack.Screen name="create" />
      <Stack.Screen name="create-preferences" />
      <Stack.Screen name="join-preferences" />
      <Stack.Screen name="swipe-users" />
      <Stack.Screen name="swipe-circles" />
      <Stack.Screen name="swipe-empty" />
      <Stack.Screen name="progress" />
      <Stack.Screen name="complete" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="call" />
    </Stack>
  );
}
