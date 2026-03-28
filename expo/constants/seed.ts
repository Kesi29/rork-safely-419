import { Guardian, HomeAddress, Coords, ConnectedEvent, SessionHistory } from '@/store/types';

export const DEFAULT_USER_NAME = 'Alex';

export const DEFAULT_PRIMARY_GUARDIAN: Guardian = {
  id: '1',
  name: 'Jordan',
  phone: '555-0192',
  email: '',
  relationship: 'Partner',
  isPrimary: true,
  avatarColor: '#18A57D',
};

export const DEFAULT_HOME_ADDRESS: HomeAddress = {
  label: 'Home',
  coords: {
    latitude: 34.0522,
    longitude: -118.2437,
  },
};

export const DEFAULT_CURRENT_COORDS: Coords = {
  latitude: 34.0672,
  longitude: -118.2987,
};

export const DEFAULT_EVENTS: ConnectedEvent[] = [
  {
    id: 'coachella-2026',
    name: 'Coachella 2026',
    endTime: '23:00',
    timezone: 'America/Los_Angeles',
  },
];

export const DEFAULT_HISTORY: SessionHistory[] = [
  {
    id: 'session-1',
    eventName: 'Coachella 2026',
    date: 'Mar 9, 2026',
    status: 'arrived',
    duration: '1h 12min',
    guardianName: 'Jordan',
    timestamp: Date.now() - 86400000,
  },
];
