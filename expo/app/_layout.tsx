import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { useSafelyStore } from "@/store";
import { trpc, trpcClient } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";

SplashScreen.preventAutoHideAsync().catch(() => {
  console.log('SplashScreen.preventAutoHideAsync failed');
});

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="tracking" options={{ headerShown: false }} />
      <Stack.Screen name="sos-modal" options={{ presentation: 'transparentModal', animation: 'fade', headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const initialize = useSafelyStore((s) => s.initialize);
  const isInitialized = useSafelyStore((s) => s.isInitialized);
  const hasOnboarded = useSafelyStore((s) => s.hasOnboarded);
  const setUserName = useSafelyStore((s) => s.setUserName);
  const setHomeAddress = useSafelyStore((s) => s.setHomeAddress);
  const setUserId = useSafelyStore((s) => s.setUserId);

  const [fontsLoaded, fontError] = useFonts({
    'PlayfairDisplay_700Italic': require('../assets/fonts/PlayfairDisplay-BoldItalic.ttf'),
    'DMSans_400Regular': require('../assets/fonts/DMSans-Regular.ttf'),
    'DMSans_500Medium': require('../assets/fonts/DMSans-Medium.ttf'),
    'DMSans_600SemiBold': require('../assets/fonts/DMSans-SemiBold.ttf'),
    'DMSans_700Bold': require('../assets/fonts/DMSans-Bold.ttf'),
  });

  useEffect(() => {
    if (fontError) {
      console.log('Font loading error:', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {
        console.log('SplashScreen.hideAsync failed');
      });
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!isInitialized || (!fontsLoaded && !fontError)) return;

    const checkSession = async () => {
      try {
        if (!hasOnboarded) {
          console.log('RootLayout: Not onboarded, redirecting to welcome');
          router.replace('/onboarding/welcome');
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();

        if (sessionData?.session?.user) {
          const userId = sessionData.session.user.id;
          console.log('RootLayout: Supabase session found, user:', userId);
          setUserId(userId);

          try {
            const { data: user } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single();

            if (user) {
              console.log('RootLayout: Hydrating from Supabase user data');
              if (user.name) setUserName(user.name);
              if (user.home_address && user.home_latitude && user.home_longitude) {
                setHomeAddress({
                  label: user.home_address,
                  coords: {
                    latitude: user.home_latitude,
                    longitude: user.home_longitude,
                  },
                });
              }
            }
          } catch (e) {
            console.log('RootLayout: Error fetching user data', e);
          }
        } else {
          console.log('RootLayout: No Supabase session, user has onboarded locally');
        }
      } catch (e) {
        console.log('RootLayout: Session check error', e);
      }
    };

    void checkSession();
  }, [isInitialized, hasOnboarded, fontsLoaded, fontError, router, setUserId, setUserName, setHomeAddress]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
