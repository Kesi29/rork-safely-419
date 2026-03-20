export type TrackingStatus = 'idle' | 'active' | 'late' | 'arrived' | 'emergency' | 'cancelled';

export type Relationship = 'Partner' | 'Parent' | 'Friend' | 'Sibling' | 'Other';

export interface Guardian {
  id: string;
  name: string;
  phone: string;
  relationship: Relationship;
  isPrimary: boolean;
  avatarColor: string;
}

export interface Coords {
  latitude: number;
  longitude: number;
}

export interface HomeAddress {
  label: string;
  coords: Coords;
}

export interface SessionData {
  activatedAt: Date | null;
  eta: Date | null;
  etaMinutes: number;
  eventName: string | null;
}

export interface ConnectedEvent {
  id: string;
  name: string;
  endTime: string;
  timezone: string;
  partnerSlug?: string;
  scannedAt?: string;
  status?: 'upcoming' | 'active' | 'ended';
}

export interface SessionHistory {
  id: string;
  eventName: string;
  date: string;
  status: 'arrived' | 'late' | 'emergency' | 'cancelled';
  duration: string;
  guardianName: string;
  timestamp: number;
}

export interface OnboardingProfile {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  guardianName: string;
  guardianPhone: string;
  emergencyName: string;
  emergencyPhone: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
}
