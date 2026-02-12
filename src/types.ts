

export interface Drink {
  id: string;
  name: string;
  volumeMl: number;
  abv: number; // Alcohol by volume percentage (e.g., 5.0)
  timestamp: number; // Unix timestamp in ms
  icon?: string;
  type?: 'beer' | 'wine' | 'cocktail' | 'spirit' | 'other';
  isChug?: boolean; // If true, consumption time is 0
}

export interface UserProfile {
  weightKg: number;
  gender: 'male' | 'female';
  isSetup: boolean;
  language: 'en' | 'fr';
  drinkingSpeed: 'slow' | 'average' | 'fast';
  displayName?: string;
  photoURL?: string;
  stayConnected?: boolean;
}


export interface FriendStatus {
  uid: string;
  displayName: string;
  photoURL?: string;
  currentBac: number;
  statusMessage: string;
  color: string;
  lastUpdate: number;
}

export interface BacStatus {
  currentBac: number; // Percentage
  peakBac: number; // Projected Peak Percentage
  peakTime: number | null; // Timestamp of peak
  soberTimestamp: number | null; // Estimated time to 0.00
  statusMessage: string;
  color: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ADD_DRINK = 'ADD_DRINK',
  SETTINGS = 'SETTINGS',
  HISTORY = 'HISTORY',
  SOCIAL = 'SOCIAL'
}

