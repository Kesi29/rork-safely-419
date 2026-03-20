import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TrackingStatus,
  Guardian,
  Coords,
  HomeAddress,
  SessionData,
  ConnectedEvent,
  SessionHistory,
  OnboardingProfile,
} from './types';
import {
  DEFAULT_USER_NAME,
  DEFAULT_PRIMARY_GUARDIAN,
  DEFAULT_HOME_ADDRESS,
  DEFAULT_CURRENT_COORDS,
  DEFAULT_EVENTS,
  DEFAULT_HISTORY,
} from '@/constants/seed';

const initialState = {
  userId: null as string | null,
  userPhone: null as string | null,
  trackingStatus: 'idle' as TrackingStatus,
  session: {
    activatedAt: null as Date | null,
    eta: null as Date | null,
    etaMinutes: 0,
    eventName: null as string | null,
  } as SessionData,
  homeAddress: DEFAULT_HOME_ADDRESS as HomeAddress,
  currentCoords: DEFAULT_CURRENT_COORDS as Coords | null,
  sosCoords: null as Coords | null,
  userName: DEFAULT_USER_NAME,
  guardians: [DEFAULT_PRIMARY_GUARDIAN] as Guardian[],
  primaryGuardian: DEFAULT_PRIMARY_GUARDIAN as Guardian | null,
  connectedEvents: DEFAULT_EVENTS as ConnectedEvent[],
  sessionHistory: DEFAULT_HISTORY as SessionHistory[],
  defaultEtaMinutes: 60,
  hasOnboarded: false,
  isInitialized: false,
  activeSessionId: null as string | null,
  activeTrackingToken: null as string | null,
  showEventWelcome: null as ConnectedEvent | null,
  onboardingProfile: {
    firstName: '',
    lastName: '',
    avatarUrl: null,
    guardianName: '',
    guardianPhone: '',
    emergencyName: '',
    emergencyPhone: '',
    onboardingCompleted: false,
    onboardingStep: 0,
  } as OnboardingProfile,
};

function _persist(state: typeof initialState) {
  const toSave = {
    userId: state.userId,
    userPhone: state.userPhone,
    userName: state.userName,
    guardians: state.guardians,
    primaryGuardian: state.primaryGuardian,
    homeAddress: state.homeAddress,
    connectedEvents: state.connectedEvents,
    sessionHistory: state.sessionHistory,
    defaultEtaMinutes: state.defaultEtaMinutes,
    hasOnboarded: state.hasOnboarded,
    onboardingProfile: state.onboardingProfile,
  };
  AsyncStorage.setItem('safely_state', JSON.stringify(toSave)).catch((e) =>
    console.log('Persist error:', e)
  );
}

export const useSafelyStore = create(
  combine(initialState, (set, get) => ({
    initialize: async () => {
      try {
        const stored = await AsyncStorage.getItem('safely_state');
        if (stored) {
          const parsed = JSON.parse(stored);
          set({
            userId: parsed.userId ?? null,
            userPhone: parsed.userPhone ?? null,
            userName: parsed.userName ?? DEFAULT_USER_NAME,
            onboardingProfile: parsed.onboardingProfile ?? initialState.onboardingProfile,
            guardians: parsed.guardians ?? [DEFAULT_PRIMARY_GUARDIAN],
            primaryGuardian: parsed.primaryGuardian ?? DEFAULT_PRIMARY_GUARDIAN,
            homeAddress: parsed.homeAddress ?? DEFAULT_HOME_ADDRESS,
            connectedEvents: parsed.connectedEvents ?? DEFAULT_EVENTS,
            sessionHistory: parsed.sessionHistory ?? DEFAULT_HISTORY,
            defaultEtaMinutes: parsed.defaultEtaMinutes ?? 60,
            hasOnboarded: parsed.hasOnboarded ?? false,
            isInitialized: true,
          });
        } else {
          set({ isInitialized: true });
        }
      } catch (e) {
        console.log('Failed to load state:', e);
        set({ isInitialized: true });
      }
    },

    setUserId: (id: string) => {
      set({ userId: id });
      _persist(get());
    },

    setUserPhone: (phone: string) => {
      set({ userPhone: phone });
      _persist(get());
    },

    setActiveSessionId: (id: string | null) => set({ activeSessionId: id }),

    setActiveTrackingToken: (token: string | null) => set({ activeTrackingToken: token }),

    setTrackingStatus: (status: TrackingStatus) => set({ trackingStatus: status }),

    startSession: (etaMinutes: number, eventName: string | null = null) => {
      const now = new Date();
      const eta = new Date(now.getTime() + etaMinutes * 60 * 1000);
      set({
        trackingStatus: 'active' as TrackingStatus,
        session: { activatedAt: now, eta, etaMinutes, eventName },
      });
    },

    endSession: () => {
      const state = get();
      if (state.session.activatedAt) {
        const duration = Date.now() - new Date(state.session.activatedAt).getTime();
        const mins = Math.floor(duration / 60000);
        const hrs = Math.floor(mins / 60);
        const remainMins = mins % 60;
        const durationStr = hrs > 0 ? `${hrs}h ${remainMins}min` : `${remainMins}min`;

        const historyEntry: SessionHistory = {
          id: `session-${Date.now()}`,
          eventName: state.session.eventName ?? 'Night Out',
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
          status: state.trackingStatus === 'emergency' ? 'emergency' : state.trackingStatus === 'late' ? 'late' : 'arrived',
          duration: durationStr,
          guardianName: state.primaryGuardian?.name ?? 'Guardian',
          timestamp: Date.now(),
        };

        const newHistory = [historyEntry, ...state.sessionHistory];
        set({
          trackingStatus: 'idle' as TrackingStatus,
          session: { activatedAt: null, eta: null, etaMinutes: 0, eventName: null },
          sosCoords: null,
          sessionHistory: newHistory,
        });
        _persist({ ...get(), sessionHistory: newHistory });
      } else {
        set({
          trackingStatus: 'idle' as TrackingStatus,
          session: { activatedAt: null, eta: null, etaMinutes: 0, eventName: null },
          sosCoords: null,
        });
      }
    },

    setCurrentCoords: (coords: Coords) => set({ currentCoords: coords }),
    setSosCoords: (coords: Coords) => set({ sosCoords: coords }),

    setUserName: (name: string) => {
      set({ userName: name });
      _persist(get());
    },

    setHomeAddress: (address: HomeAddress) => {
      set({ homeAddress: address });
      _persist(get());
    },

    addGuardian: (guardian: Guardian) => {
      const state = get();
      const guardians = [...state.guardians, guardian];
      if (guardian.isPrimary) {
        guardians.forEach((g) => {
          if (g.id !== guardian.id) g.isPrimary = false;
        });
      }
      const primary = guardian.isPrimary ? guardian : state.primaryGuardian;
      set({ guardians, primaryGuardian: primary });
      _persist({ ...get(), guardians, primaryGuardian: primary });
    },

    updateGuardian: (guardian: Guardian) => {
      const state = get();
      const guardians = state.guardians.map((g) => (g.id === guardian.id ? guardian : g));
      if (guardian.isPrimary) {
        guardians.forEach((g) => {
          if (g.id !== guardian.id) g.isPrimary = false;
        });
      }
      const primary = guardians.find((g) => g.isPrimary) ?? guardians[0] ?? null;
      set({ guardians, primaryGuardian: primary });
      _persist({ ...get(), guardians, primaryGuardian: primary });
    },

    removeGuardian: (id: string) => {
      const state = get();
      const guardians = state.guardians.filter((g) => g.id !== id);
      const primary = guardians.find((g) => g.isPrimary) ?? guardians[0] ?? null;
      if (primary && !primary.isPrimary) primary.isPrimary = true;
      set({ guardians, primaryGuardian: primary });
      _persist({ ...get(), guardians, primaryGuardian: primary });
    },

    setPrimaryGuardian: (id: string) => {
      const state = get();
      const guardians = state.guardians.map((g) => ({ ...g, isPrimary: g.id === id }));
      const primary = guardians.find((g) => g.isPrimary) ?? null;
      set({ guardians, primaryGuardian: primary });
      _persist({ ...get(), guardians, primaryGuardian: primary });
    },

    addConnectedEvent: (event: ConnectedEvent) => {
      const state = get();
      if (state.connectedEvents.some((e) => e.id === event.id)) return;
      const events = [...state.connectedEvents, event];
      set({ connectedEvents: events });
      _persist({ ...get(), connectedEvents: events });
    },

    addEvent: (event: ConnectedEvent) => {
      const state = get();
      if (state.connectedEvents.some((e) => e.id === event.id)) return;
      const events = [...state.connectedEvents, event];
      set({ connectedEvents: events });
      _persist({ ...get(), connectedEvents: events });
    },

    setShowEventWelcome: (event: ConnectedEvent | null) => {
      set({ showEventWelcome: event });
    },

    clearEventWelcome: () => {
      set({ showEventWelcome: null });
    },

    addSessionHistory: (entry: SessionHistory) => {
      const state = get();
      const history = [entry, ...state.sessionHistory];
      set({ sessionHistory: history });
      _persist({ ...get(), sessionHistory: history });
    },

    setDefaultEtaMinutes: (value: number) => {
      set({ defaultEtaMinutes: value });
      _persist(get());
    },

    removeEvent: (id: string) => {
      const state = get();
      const events = state.connectedEvents.filter((e) => e.id !== id);
      set({ connectedEvents: events });
      _persist({ ...get(), connectedEvents: events });
    },

    setHasOnboarded: (value: boolean) => {
      set({ hasOnboarded: value });
      _persist({ ...get(), hasOnboarded: value });
    },

    updateOnboardingProfile: (updates: Partial<OnboardingProfile>) => {
      const current = get().onboardingProfile;
      const updated = { ...current, ...updates };
      set({ onboardingProfile: updated });
      _persist({ ...get(), onboardingProfile: updated });
    },

    completeOnboarding: () => {
      const profile = get().onboardingProfile;
      const fullName = `${profile.firstName} ${profile.lastName}`.trim();
      if (fullName) {
        set({ userName: fullName });
      }
      set({
        hasOnboarded: true,
        onboardingProfile: { ...profile, onboardingCompleted: true },
      });
      _persist(get());
    },
  }))
);
