/// <reference path="../firebase.d.ts" />

import { useState, useCallback } from 'react';
import { db, collection, getDocs } from '../firebase';
import { Drink, UserProfile, FriendGroup } from '../types';
import { calculateBac } from '../services/bacService';

// ─── Types ───────────────────────────────────────────────────
export interface LiveUser {
    uid: string;
    username: string;
    photoURL: string;
    currentBac: number;
    statusMessage: string;
    color: string;
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
    count: number; // number of drinks of this type
}

export interface MonthlyGroupStat {
    groupId: string;
    groupName: string;
    groupIcon?: string;
    totalAlcoholMl: number; // pure alcohol in ml
    memberCount: number;
}

export interface GlobalLiveStats {
    totalNotSober: number;
    avgBacNotSober: number;
    topUsers: LiveUser[];         // Top 10 by BAC
    topGroups: LiveGroupRanking[]; // Top 3 groups by avg BAC
}

export interface GlobalMonthlyStats {
    topBeer: MonthlyUserStat[];     // Top 5
    topWine: MonthlyUserStat[];     // Top 5
    topSpirits: MonthlyUserStat[];  // Top 5
    topGroups: MonthlyGroupStat[];  // Top 3
}

// ─── Hook ─────────────────────────────────────────────────────
export const useGlobalStats = () => {
    const [liveStats, setLiveStats] = useState<GlobalLiveStats | null>(null);
    const [monthlyStats, setMonthlyStats] = useState<GlobalMonthlyStats | null>(null);
    const [loadingLive, setLoadingLive] = useState(false);
    const [loadingMonthly, setLoadingMonthly] = useState(false);

    // ─── LIVE STATS ────────────────────────────────────────────
    const fetchLiveStats = useCallback(async () => {
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

            // 2. Fetch ALL drinks docs
            const drinksSnap = await getDocs(collection(db, "drinks"));
            const drinksMap: Record<string, Drink[]> = {};
            drinksSnap.forEach((d: any) => {
                drinksMap[d.id] = (d.data()?.list || []) as Drink[];
            });

            // 3. Calculate current BAC for each user
            const liveUsers: LiveUser[] = [];
            for (const { uid, profile } of allUsers) {
                const userDrinks = drinksMap[uid] || [];
                if (userDrinks.length === 0) continue;
                const bac = calculateBac(userDrinks, profile);
                if (bac.currentBac > 0) {
                    liveUsers.push({
                        uid,
                        username: profile.username || profile.displayName || 'Anon',
                        photoURL: profile.customPhotoURL || profile.photoURL || '',
                        currentBac: bac.currentBac,
                        statusMessage: bac.statusMessage,
                        color: bac.color,
                    });
                }
            }

            // Sort by BAC descending
            liveUsers.sort((a, b) => b.currentBac - a.currentBac);

            const totalNotSober = liveUsers.length;
            const avgBac = totalNotSober > 0
                ? liveUsers.reduce((sum, u) => sum + u.currentBac, 0) / totalNotSober
                : 0;

            // 4. Group rankings — fetch all groups
            const groupsSnap = await getDocs(collection(db, "groups"));
            const groupRankings: LiveGroupRanking[] = [];

            groupsSnap.forEach((gDoc: any) => {
                const gData = gDoc.data() as FriendGroup;
                const memberIds: string[] = gData.memberIds || [];

                // Calculate avg from ALL members (sober = 0)
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
                totalNotSober,
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
    const fetchMonthlyStats = useCallback(async () => {
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

            // 2. Fetch ALL drinks
            const drinksSnap = await getDocs(collection(db, "drinks"));
            const allDrinksMap: Record<string, Drink[]> = {};
            drinksSnap.forEach((d: any) => {
                allDrinksMap[d.id] = (d.data()?.list || []) as Drink[];
            });

            // 3. Per-user: count beer/wine/spirits this month + total pure alcohol
            interface UserMonthData {
                uid: string;
                beerCount: number;
                wineCount: number;
                spiritCount: number;
                totalAlcoholMl: number; // pure alcohol volume
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

            const toStatUser = (uid: string, count: number): MonthlyUserStat => {
                const p = profilesMap[uid];
                return {
                    uid,
                    username: p?.username || p?.displayName || 'Anon',
                    photoURL: p?.customPhotoURL || p?.photoURL || '',
                    count,
                };
            };

            // Top 5 for each type
            const allUserData = Object.values(userData);

            const topBeer = allUserData
                .filter(u => u.beerCount > 0)
                .sort((a, b) => b.beerCount - a.beerCount)
                .slice(0, 5)
                .map(u => toStatUser(u.uid, u.beerCount));

            const topWine = allUserData
                .filter(u => u.wineCount > 0)
                .sort((a, b) => b.wineCount - a.wineCount)
                .slice(0, 5)
                .map(u => toStatUser(u.uid, u.wineCount));

            const topSpirits = allUserData
                .filter(u => u.spiritCount > 0)
                .sort((a, b) => b.spiritCount - a.spiritCount)
                .slice(0, 5)
                .map(u => toStatUser(u.uid, u.spiritCount));

            // 4. Top 3 groups by cumulative pure alcohol this month
            const groupsSnap = await getDocs(collection(db, "groups"));
            const groupStats: MonthlyGroupStat[] = [];

            groupsSnap.forEach((gDoc: any) => {
                const gData = gDoc.data() as FriendGroup;
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
