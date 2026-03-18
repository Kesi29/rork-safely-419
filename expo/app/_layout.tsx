import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import { useSafelyStore } from "@/store";
import { trpc, trpcClient } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { setupNotificationCategories, scheduleLocalNotification } from "@/hooks/useNotifications";
import { ConnectedEvent } from "@/store/types";

SplashScreen.preventAutoHideAsync().catch(() => {
  console.log('SplashScreen.preventAutoHideAsync failed');
});

async function scheduleEventEndNotification(event: ConnectedEvent): Promise<void> {
  try {
    if (!event.endTime) return;
    const [hours, minutes] = event.endTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;
    const now = new Date();
    const end = new Date();
    end.setHours(hours, minutes, 0, 0);
    if (end.getTime() <= now.getTime()) end.setDate(end.getDate() + 1);
    const secondsUntil = Math.floor((end.getTime() - now.getTime()) / 1000);
    if (secondsUntil <= 0) return;
    const notifId = await scheduleLocalNotification(
      `${event.name} is wrapping up`,
      'Stay safe getting home \u2014 tap to turn on Safely',
      secondsUntil,
      'EVENT_END'
    );
    if (notifId) {
      await AsyncStorage.setItem(`safely_event_notif_${event.id}`, notifId);
    }
    console.log('Scheduled event end notification in', secondsUntil, 'seconds');
  } catch (e) {
    console.log('scheduleEventEndNotification error:', e);
  }
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="tracking" options={{ headerShown: false }} />
      <Stack.Screen name="legal" options={{ headerShown: false }} />
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
    void setupNotificationCategories();
  }, []);

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      if (!url) return;
      console.log('RootLayout: Deep link received:', url);
      try {
        const parsed = Linking.parse(url);
        if (parsed.path === 'event' || url.includes('safely://event')) {
          const params = parsed.queryParams;
          if (params?.id && params?.name) {
            const newEvent: ConnectedEvent = {
              id: params.id as string,
              name: decodeURIComponent(params.name as string),
              endTime: (params.endTime as string) ?? '23:00',
              timezone: (params.timezone as string) ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
              partnerSlug: (params.partner as string) ?? undefined,
              scannedAt: new Date().toISOString(),
              status: 'upcoming',
            };
            console.log('RootLayout: Adding connected event:', newEvent.name);
            useSafelyStore.getState().addConnectedEvent(newEvent);
            useSafelyStore.getState().setShowEventWelcome(newEvent);
            void scheduleEventEndNotification(newEvent);
          }
        }
      } catch (e) {
        console.log('RootLayout: Deep link parse error', e);
      }
    };

    void Linking.getInitialURL().then((url) => {
      if (url) void handleDeepLink(url);
    }).catch((e) => console.log('RootLayout: getInitialURL error', e));

    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, []);

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
          <ErrorBoundary>
            <RootLayoutNav />
          </ErrorBoundary>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
