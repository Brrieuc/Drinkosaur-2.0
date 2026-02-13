/// <reference path="../firebase.d.ts" />

import { useState, useCallback } from 'react';
import { db, collection, getDocs } from '../firebase';
import { Drink, UserProfile, FriendGroup, LeaderboardVisibility } from '../types';
import { calculateBac } from '../services/bacService';

// ─── Types ───────────────────────────────────────────────────
export interface LiveUser {
    uid: string;
    username: string;        // real or anonymized
    photoURL: string;        // real or empty
    currentBac: number;      // always present for ranking, but UI hides for non-friends
    statusMessage: string;
    color: string;
    isFriend: boolean;
    isMe: boolean;
    visibility: LeaderboardVisibility;
    // Extra data for live recalculation
    drinks?: Drink[];
    weightKg?: number;
    gender?: 'male' | 'female';
    drinkingSpeed?: 'slow' | 'average' | 'fast';
    lastUpdate?: number;
}

export interface LiveGroupRanking {
    groupId: string;
    groupName: string;
    groupIcon?: string;
    avgBac: number;
    memberCount: number;
}

export interface MonthlyUserStat {
    uid: string;
    username: string;
    photoURL: string;
    count: number;
    isFriend: boolean;
    isMe: boolean;
    visibility: LeaderboardVisibility;
}

export interface MonthlyGroupStat {
    groupId: string;
    groupName: string;
    groupIcon?: string;
    totalAlcoholMl: number;
    memberCount: number;
}

export interface GlobalLiveStats {
    totalNotSober: number;
    avgBacNotSober: number;
    topUsers: LiveUser[];
    topGroups: LiveGroupRanking[];
}

export interface GlobalMonthlyStats {
    topBeer: MonthlyUserStat[];
    topWine: MonthlyUserStat[];
    topSpirits: MonthlyUserStat[];
    topGroups: MonthlyGroupStat[];
}

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Determine if the viewer can see this user's real identity.
 * - 'hidden' → never shown in rankings at all (filtered before this)
 * - 'friends_only' → visible to friends, anonymous to others
 * - 'friends_of_friends' → visible to friends and friends-of-friends
 * - 'public' → visible to everyone
 */
function canSeeIdentity(
    targetVisibility: LeaderboardVisibility,
    isFriend: boolean,
    isFriendOfFriend: boolean,
    isMe: boolean
): boolean {
    if (isMe) return true;
    switch (targetVisibility) {
        case 'public': return true;
        case 'friends_of_friends': return isFriend || isFriendOfFriend;
        case 'friends_only': return isFriend;
        case 'hidden': return false;
        default: return isFriend; // default to friends_only
    }
}

// ─── Hook ─────────────────────────────────────────────────────
export const useGlobalStats = () => {
    const [liveStats, setLiveStats] = useState<GlobalLiveStats | null>(null);
    const [monthlyStats, setMonthlyStats] = useState<GlobalMonthlyStats | null>(null);
    const [loadingLive, setLoadingLive] = useState(false);
    const [loadingMonthly, setLoadingMonthly] = useState(false);

    // ─── LIVE STATS ────────────────────────────────────────────
    const fetchLiveStats = useCallback(async (myUid: string) => {
        setLoadingLive(true);
        try {
            // 1. Fetch ALL users
            const usersSnap = await getDocs(collection(db, "users"));
            const allUsers: { uid: string; profile: UserProfile }[] = [];
            usersSnap.forEach((d: any) => {
                const data = d.data() as UserProfile;
                if (data.isSetup && data.weightKg > 0) {
                    allUsers.push({ uid: d.id, profile: { ...data, uid: d.id } });
                }
            });

            // Build friend sets for privacy
            const myProfile = allUsers.find(u => u.uid === myUid)?.profile;
            const myFriends = new Set<string>(myProfile?.friends || []);
            // Friends-of-friends: collect all friends' friends
            const friendsOfFriends = new Set<string>();
            for (const u of allUsers) {
                if (myFriends.has(u.uid)) {
                    for (const fof of (u.profile.friends || [])) {
                        if (fof !== myUid) friendsOfFriends.add(fof);
                    }
                }
            }

            // 2. Fetch ALL drinks docs
            const drinksSnap = await getDocs(collection(db, "drinks"));
            const drinksMap: Record<string, Drink[]> = {};
            drinksSnap.forEach((d: any) => {
                drinksMap[d.id] = (d.data()?.list || []) as Drink[];
            });

            // 3. Calculate current BAC for each user + apply visibility
            const liveUsers: LiveUser[] = [];
            let totalNotSoberCount = 0;
            let totalBacSum = 0;

            for (const { uid, profile } of allUsers) {
                const userDrinks = drinksMap[uid] || [];
                if (userDrinks.length === 0) continue;
                const bac = calculateBac(userDrinks, profile);
                if (bac.currentBac <= 0) continue;

                totalNotSoberCount++;
                totalBacSum += bac.currentBac;

                const visibility = profile.leaderboardVisibility || 'friends_only';

                // Skip users who chose 'hidden'
                if (visibility === 'hidden') continue;

                const isMe = uid === myUid;
                const isFriend = myFriends.has(uid);
                const isFoF = friendsOfFriends.has(uid);
                const showIdentity = canSeeIdentity(visibility, isFriend, isFoF, isMe);

                liveUsers.push({
                    uid,
                    username: showIdentity ? (profile.username || profile.displayName || 'Anon') : '???',
                    photoURL: showIdentity ? (profile.customPhotoURL || profile.photoURL || '') : '',
                    currentBac: bac.currentBac,
                    statusMessage: bac.statusMessage,
                    color: bac.color,
                    isFriend,
                    isMe,
                    visibility,
                    drinks: userDrinks,
                    weightKg: profile.weightKg,
                    gender: profile.gender,
                    drinkingSpeed: profile.drinkingSpeed,
                    lastUpdate: Date.now()
                });
            }

            liveUsers.sort((a, b) => b.currentBac - a.currentBac);

            const avgBac = totalNotSoberCount > 0 ? totalBacSum / totalNotSoberCount : 0;

            // 4. Group rankings — only groups with showInGlobalRanking !== false
            const groupsSnap = await getDocs(collection(db, "groups"));
            const groupRankings: LiveGroupRanking[] = [];

            groupsSnap.forEach((gDoc: any) => {
                const gData = gDoc.data() as FriendGroup;

                // Respect group privacy: skip if explicitly hidden
                if (gData.showInGlobalRanking === false) return;

                const memberIds: string[] = gData.memberIds || [];
                const allMemberBacs = memberIds.map(mid => {
                    const found = liveUsers.find(u => u.uid === mid);
                    return found ? found.currentBac : 0;
                });

                if (allMemberBacs.length > 0) {
                    const avg = allMemberBacs.reduce((s, b) => s + b, 0) / allMemberBacs.length;
                    if (avg > 0) {
                        groupRankings.push({
                            groupId: gDoc.id,
                            groupName: gData.name,
                            groupIcon: gData.icon,
                            avgBac: avg,
                            memberCount: memberIds.length,
                        });
                    }
                }
            });

            groupRankings.sort((a, b) => b.avgBac - a.avgBac);

            setLiveStats({
                totalNotSober: totalNotSoberCount,
                avgBacNotSober: parseFloat(avgBac.toFixed(4)),
                topUsers: liveUsers.slice(0, 10),
                topGroups: groupRankings.slice(0, 3),
            });
        } catch (err) {
            console.error("Error fetching live stats:", err);
        } finally {
            setLoadingLive(false);
        }
    }, []);

    // ─── MONTHLY STATS ─────────────────────────────────────────
    const fetchMonthlyStats = useCallback(async (myUid: string) => {
        setLoadingMonthly(true);
        try {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

            // 1. Fetch ALL users
            const usersSnap = await getDocs(collection(db, "users"));
            const profilesMap: Record<string, UserProfile> = {};
            usersSnap.forEach((d: any) => {
                const data = d.data() as UserProfile;
                if (data.isSetup) {
                    profilesMap[d.id] = { ...data, uid: d.id };
                }
            });

            // Build friend sets
            const myProfile = profilesMap[myUid];
            const myFriends = new Set<string>(myProfile?.friends || []);
            const friendsOfFriends = new Set<string>();
            for (const [uid, p] of Object.entries(profilesMap)) {
                if (myFriends.has(uid)) {
                    for (const fof of (p.friends || [])) {
                        if (fof !== myUid) friendsOfFriends.add(fof);
                    }
                }
            }

            // 2. Fetch ALL drinks
            const drinksSnap = await getDocs(collection(db, "drinks"));
            const allDrinksMap: Record<string, Drink[]> = {};
            drinksSnap.forEach((d: any) => {
                allDrinksMap[d.id] = (d.data()?.list || []) as Drink[];
            });

            // 3. Per-user: count beer/wine/spirits this month
            interface UserMonthData {
                uid: string;
                beerCount: number;
                wineCount: number;
                spiritCount: number;
                totalAlcoholMl: number;
            }

            const userData: Record<string, UserMonthData> = {};

            for (const [uid, drinks] of Object.entries(allDrinksMap)) {
                const monthDrinks = drinks.filter(d => d.timestamp >= monthStart);
                if (monthDrinks.length === 0) continue;

                let beerCount = 0;
                let wineCount = 0;
                let spiritCount = 0;
                let totalAlcoholMl = 0;

                for (const d of monthDrinks) {
                    const type = d.type || 'other';
                    const pureAlcohol = d.volumeMl * (d.abv / 100);
                    totalAlcoholMl += pureAlcohol;

                    if (type === 'beer') beerCount++;
                    else if (type === 'wine') wineCount++;
                    else if (type === 'spirit' || type === 'cocktail') spiritCount++;
                }

                userData[uid] = { uid, beerCount, wineCount, spiritCount, totalAlcoholMl };
            }

            const toStatUser = (uid: string, count: number): MonthlyUserStat | null => {
                const p = profilesMap[uid];
                const visibility = p?.leaderboardVisibility || 'friends_only';

                // Skip hidden users
                if (visibility === 'hidden') return null;

                const isMe = uid === myUid;
                const isFriend = myFriends.has(uid);
                const isFoF = friendsOfFriends.has(uid);
                const showIdentity = canSeeIdentity(visibility, isFriend, isFoF, isMe);

                return {
                    uid,
                    username: showIdentity ? (p?.username || p?.displayName || 'Anon') : '???',
                    photoURL: showIdentity ? (p?.customPhotoURL || p?.photoURL || '') : '',
                    count,
                    isFriend,
                    isMe,
                    visibility,
                };
            };

            const allUserData = Object.values(userData);

            const topBeer = allUserData
                .filter(u => u.beerCount > 0)
                .sort((a, b) => b.beerCount - a.beerCount)
                .slice(0, 5)
                .map(u => toStatUser(u.uid, u.beerCount))
                .filter(Boolean) as MonthlyUserStat[];

            const topWine = allUserData
                .filter(u => u.wineCount > 0)
                .sort((a, b) => b.wineCount - a.wineCount)
                .slice(0, 5)
                .map(u => toStatUser(u.uid, u.wineCount))
                .filter(Boolean) as MonthlyUserStat[];

            const topSpirits = allUserData
                .filter(u => u.spiritCount > 0)
                .sort((a, b) => b.spiritCount - a.spiritCount)
                .slice(0, 5)
                .map(u => toStatUser(u.uid, u.spiritCount))
                .filter(Boolean) as MonthlyUserStat[];

            // 4. Top 3 groups — respect showInGlobalRanking
            const groupsSnap = await getDocs(collection(db, "groups"));
            const groupStats: MonthlyGroupStat[] = [];

            groupsSnap.forEach((gDoc: any) => {
                const gData = gDoc.data() as FriendGroup;

                if (gData.showInGlobalRanking === false) return;

                const memberIds: string[] = gData.memberIds || [];
                let totalGroupAlcohol = 0;
                for (const mid of memberIds) {
                    totalGroupAlcohol += userData[mid]?.totalAlcoholMl || 0;
                }
                if (totalGroupAlcohol > 0) {
                    groupStats.push({
                        groupId: gDoc.id,
                        groupName: gData.name,
                        groupIcon: gData.icon,
                        totalAlcoholMl: totalGroupAlcohol,
                        memberCount: memberIds.length,
                    });
                }
            });

            groupStats.sort((a, b) => b.totalAlcoholMl - a.totalAlcoholMl);

            setMonthlyStats({
                topBeer,
                topWine,
                topSpirits,
                topGroups: groupStats.slice(0, 3),
            });
        } catch (err) {
            console.error("Error fetching monthly stats:", err);
        } finally {
            setLoadingMonthly(false);
        }
    }, []);

    return {
        liveStats,
        monthlyStats,
        loadingLive,
        loadingMonthly,
        fetchLiveStats,
        fetchMonthlyStats,
    };
};
