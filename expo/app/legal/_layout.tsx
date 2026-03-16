import { Stack } from "expo-router";
import React from "react";

export default function LegalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="disclaimer" />
      <Stack.Screen name="licenses" />
      <Stack.Screen name="about" />
    </Stack>
  );
}
