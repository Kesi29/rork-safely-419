import { Stack } from "expo-router";
import React from "react";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="phone" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="name" />
      <Stack.Screen name="profile-photo" />
      <Stack.Screen name="guardian" />
      <Stack.Screen name="emergency-contact" />
      <Stack.Screen name="notification-permission" />
      <Stack.Screen name="location-permission" />
      <Stack.Screen name="all-set" />
    </Stack>
  );
}
