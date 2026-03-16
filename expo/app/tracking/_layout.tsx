import { Stack } from "expo-router";
import React from "react";

export default function TrackingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="active" />
      <Stack.Screen name="arrived" />
      <Stack.Screen name="late" />
      <Stack.Screen name="emergency" />
    </Stack>
  );
}
