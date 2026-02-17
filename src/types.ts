

export interface Drink {
  id: string;
  name: string;
  volumeMl: number;
  abv: number; // Alcohol by volume percentage (e.g., 5.0)
  timestamp: number; // Unix timestamp in ms
  icon?: string;
  type?: 'beer' | 'wine' | 'cocktail' | 'spirit' | 'other';
  color?: string; // Hex or rgba for liquid rendering
  isChug?: boolean; // If true, consumption time is 0
  lat?: number; // Masked latitude
  lng?: number; // Masked longitude
}

export type LeaderboardVisibility = 'hidden' | 'friends_only' | 'friends_of_friends' | 'public';
export type GroupListVisibility = 'visible' | 'anonymous' | 'hidden';

export interface UserProfile {
  uid?: string;
  weightKg: number;
  gender: 'male' | 'female';
  isSetup: boolean;
  language: 'en' | 'fr';
  drinkingSpeed: 'slow' | 'average' | 'fast';
  habitLevel?: 'low' | 'average' | 'high' | 'chronic';
  displayName?: string;
  photoURL?: string;
  customPhotoURL?: string;
  username?: string;
  stayConnected?: boolean;
  hasSeenTour?: boolean;
  hasSeenPwaInstallGuide?: boolean;
  friends?: string[];
  groups?: string[];
  birthDate?: string; // ISO date string (YYYY-MM-DD)
  photoVisibleToFriends?: boolean; // Privacy: show photo to friends
  wonAwards?: WonAward[]; // All awards this user has won
  selectedBadges?: string[]; // Up to 3 award IDs to display as badges
  // Privacy settings
  leaderboardVisibility?: LeaderboardVisibility; // How user appears in global rankings (default: 'friends_only')
  badgesPublic?: boolean;            // Whether badges are visible to non-friends (default: true)
  groupListVisibility?: GroupListVisibility; // How user appears in public group member lists (default: 'visible')
  drinkosaurPassConfig?: DrinkosaurPassConfig;
  allowGlobalRequests?: boolean; // If true, allows friend requests from global leaderboard
  bestRanking?: number;
  adsWatchedCharity?: number; // Total ads watched to support charity
  isAdmin?: boolean;
  isBanned?: boolean;
  banReason?: string;
  banTimestamp?: number;
  banAppealMessage?: string;
  banAppealTimestamp?: number;
}

export type PassStatType =
  | 'bestRanking'
  | 'totalPureAlcohol'
  | 'totalVolumeByAlcohol'
  | 'longestStreak'
  | 'longestIntoxicated'
  | 'favoriteDrink'
  | 'totalChugs'
  | 'totalShots';

export interface PassStat {
  type: PassStatType;
  alcoholType?: 'beer' | 'wine' | 'cocktail' | 'spirit';
}

export interface DrinkosaurPassConfig {
  selectedBadges: string[]; // Up to 3 award IDs
  backgroundColor: string;
  stats: PassStat[]; // Exactly 4
  profileEffect?: 'none' | 'fire' | 'electric' | 'glitch' | 'neon' | 'divine';
}

export interface WonAward {
  awardId: string;      // e.g. 'rhumosaur'
  groupId: string;      // which group it was won in
  groupName: string;    // group display name
  month: number;        // 0-indexed
  year: number;
  value: string;        // display value e.g. '12 drinks'
  wonAt: number;        // timestamp of when it was recorded
}




export interface FriendStatus {
  uid: string;
  displayName: string;
  photoURL?: string;
  currentBac: number;
  statusMessage: string;
  color: string;
  lastUpdate: number;
  // Raw data for local recalculation
  drinks: Drink[];
  weightKg: number;
  gender: 'male' | 'female';
  drinkingSpeed: 'slow' | 'average' | 'fast';
  habitLevel?: 'low' | 'average' | 'high' | 'chronic';
  drinkosaurPassConfig?: DrinkosaurPassConfig;
}

export interface BacStatus {
  currentBac: number; // Percentage
  peakBac: number; // Projected Peak Percentage
  peakTime: number | null; // Timestamp of peak
  soberTimestamp: number | null; // Estimated time to 0.00
  statusMessage: string;
  color: string;
}

export interface FriendGroup {
  id: string;
  name: string;
  creatorId: string;
  memberIds: string[];
  pendingInviteIds: string[];
  createdAt: number;
  icon?: string;
  // Privacy settings (only creator can change)
  showInGlobalRanking?: boolean;  // Whether group appears in global rankings (default: true)
  memberListPublic?: boolean;     // Whether the member list is publicly visible (default: false)
}


export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'admin_message' | 'system';
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ADD_DRINK = 'ADD_DRINK',
  SETTINGS = 'SETTINGS',
  HISTORY = 'HISTORY',
  SOCIAL = 'SOCIAL',
  GLOBE = 'GLOBE',
  ADMIN = 'ADMIN',
}

