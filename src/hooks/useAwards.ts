/// <reference path="../firebase.d.ts" />

import { useState } from 'react';
import { db, collection, query, where, getDocs, getDoc, doc, updateDoc, arrayUnion } from '../firebase';
import { Drink, UserProfile, WonAward } from '../types';
import { AWARD_DEFINITIONS, ComputedAward, AwardCategory } from '../constants/awards';
import { calculateBac } from '../services/bacService';

// Keywords / drink names to match for spirit sub-categories
const RUM_KEYWORDS = ['rhum', 'rum', 'captain morgan', 'havana', 'diplomatico', 'don papa', 'bacardi', 'kraken', 'plantation'];
const VODKA_KEYWORDS = ['vodka', 'grey goose', 'absolut', 'smirnoff', 'belvedere', 'stolichnaya', 'titos'];
const GIN_KEYWORDS = ['gin', 'tanqueray', "hendrick", 'bombay', 'beefeater', 'gordon'];
const TEQUILA_KEYWORDS = ['tequila', 'jose cuervo', 'patron', 'don julio', 'casamigos', 'mezcal'];
const WHISKY_KEYWORDS = ['whisk', 'bourbon', "jack daniel", 'jameson', 'chivas', 'nikka', 'glenfiddich', 'macallan', 'lagavulin', 'johnnie walker', 'maker'];
const CHAMPAGNE_KEYWORDS = ['champagne', 'moët', 'moet', 'veuve', 'dom pérignon', 'dom perignon', 'krug', 'bollinger', 'prosecco'];

/** Check if a drink name matches any keyword in a list */
const matchesDrinkCategory = (drinkName: string, keywords: string[]): boolean => {
    const lower = drinkName.toLowerCase();
    return keywords.some(kw => lower.includes(kw));
};

/** Check if a drink is a shot (small volume spirit) */
const isShot = (drink: Drink): boolean => {
    return drink.type === 'spirit' && drink.volumeMl <= 60;
};

/** Check if a drink is beer */
const isBeer = (drink: Drink): boolean => {
    return drink.type === 'beer';
};

/** Check if a drink is wine (non-champagne) */
const isWine = (drink: Drink): boolean => {
    if (drink.type !== 'wine') return false;
    // Exclude champagne
    return !matchesDrinkCategory(drink.name, CHAMPAGNE_KEYWORDS);
};

/** Check if a drink is champagne */
const isChampagne = (drink: Drink): boolean => {
    // Champagne can be typed as 'wine' with champagne name
    return matchesDrinkCategory(drink.name, CHAMPAGNE_KEYWORDS);
};

interface MemberData {
    uid: string;
    displayName: string;
    photoURL: string;
    drinks: Drink[];
    profile: UserProfile;
}

/** Filter drinks to only those in a given month */
const filterDrinksByMonth = (drinks: Drink[], month: number, year: number): Drink[] => {
    return drinks.filter(d => {
        const date = new Date(d.timestamp);
        return date.getMonth() === month && date.getFullYear() === year;
    });
};

/** Count unique drinking days */
const countUniqueDays = (drinks: Drink[]): number => {
    const days = new Set(drinks.map(d => {
        const date = new Date(d.timestamp);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    }));
    return days.size;
};

/** Calculate highest peak BAC for a set of drinks using the bacService */
const calculatePeakBac = (drinks: Drink[], profile: UserProfile): number => {
    if (drinks.length === 0 || !profile.weightKg) return 0;
    const result = calculateBac(drinks, profile);
    return result.peakBac;
};

/** Calculate longest continuous drunk duration (in hours) */
const calculateLongestDrunkDuration = (drinks: Drink[], profile: UserProfile): number => {
    if (drinks.length === 0 || !profile.weightKg) return 0;

    // Group drinks by "drinking session" (gaps > 8h = new session)
    const sorted = [...drinks].sort((a, b) => a.timestamp - b.timestamp);
    const sessions: Drink[][] = [];
    let currentSession: Drink[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const gap = sorted[i].timestamp - sorted[i - 1].timestamp;
        if (gap > 8 * 60 * 60 * 1000) {
            sessions.push(currentSession);
            currentSession = [sorted[i]];
        } else {
            currentSession.push(sorted[i]);
        }
    }
    sessions.push(currentSession);

    // For each session, calculate how long before sobering up
    let maxDurationMs = 0;
    for (const session of sessions) {
        const bacResult = calculateBac(session, profile);
        if (bacResult.soberTimestamp && bacResult.peakBac > 0) {
            const durationMs = bacResult.soberTimestamp - session[0].timestamp;
            if (durationMs > maxDurationMs) maxDurationMs = durationMs;
        }
    }

    return maxDurationMs / (1000 * 60 * 60); // Convert to hours
};

/** Calculate volume by sub-category in liters */
const volumeByCategory = (drinks: Drink[], keywords: string[]): number => {
    return drinks
        .filter(d => matchesDrinkCategory(d.name, keywords))
        .reduce((sum, d) => sum + d.volumeMl, 0) / 1000;
};

/** Calculate total volume of filtered drinks in liters */
const totalVolumeLiters = (drinks: Drink[], filterFn: (d: Drink) => boolean): number => {
    return drinks.filter(filterFn).reduce((sum, d) => sum + d.volumeMl, 0) / 1000;
};

/** Calculate total alcohol consumed (in grams) for "least drinks" comparison */
const totalAlcoholGrams = (drinks: Drink[]): number => {
    return drinks.reduce((sum, d) => sum + (d.volumeMl * (d.abv / 100) * 0.789), 0);
};

// Launch date: February 2026
const APP_LAUNCH_MONTH = 1; // February
const APP_LAUNCH_YEAR = 2026;

/** Compute all awards for a group in a specific month */
const computeMonthlyAwards = (
    membersData: MemberData[],
    month: number,
    year: number,
    language: 'en' | 'fr'
): ComputedAward[] => {
    const awards: ComputedAward[] = [];

    // Check if period is before launch
    if (year < APP_LAUNCH_YEAR || (year === APP_LAUNCH_YEAR && month < APP_LAUNCH_MONTH)) {
        return [];
    }

    // Pre-filter drinks for the month
    const membersMonthly = membersData.map(m => ({
        ...m,
        monthlyDrinks: filterDrinksByMonth(m.drinks, month, year),
    }));

    // Calculate group total activity to validate "least_drinks"
    const groupTotalAlcohol = membersMonthly.reduce((sum, m) => sum + totalAlcoholGrams(m.monthlyDrinks), 0);

    // For each award category, find the winner
    for (const awardDef of AWARD_DEFINITIONS) {
        // Skip Sobrosaure if nobody drank anything in the group this month
        if (awardDef.category === 'least_drinks' && groupTotalAlcohol === 0) {
            continue;
        }

        let bestUid = '';
        let bestName = '';
        let bestPhoto = '';
        let bestValue: number = awardDef.category === 'least_drinks' ? Infinity : -1;
        let bestDisplayValue: string = '';

        for (const member of membersMonthly) {
            let value = 0;
            let displayValue = '';

            switch (awardDef.category as AwardCategory) {
                case 'most_rum':
                    value = volumeByCategory(member.monthlyDrinks, RUM_KEYWORDS);
                    displayValue = `${value.toFixed(2)}L`;
                    break;
                case 'most_shots':
                    value = member.monthlyDrinks.filter(isShot).length;
                    displayValue = `${value} shots`;
                    break;
                case 'most_vodka':
                    value = volumeByCategory(member.monthlyDrinks, VODKA_KEYWORDS);
                    displayValue = `${value.toFixed(2)}L`;
                    break;
                case 'most_party_days':
                    value = countUniqueDays(member.monthlyDrinks);
                    displayValue = `${value} ${language === 'fr' ? 'jours' : 'days'}`;
                    break;
                case 'highest_peak_bac':
                    value = calculatePeakBac(member.monthlyDrinks, member.profile);
                    displayValue = language === 'fr'
                        ? `${(value * 10).toFixed(2)} g/L`
                        : `${value.toFixed(3)}%`;
                    break;
                case 'longest_drunk_duration':
                    value = calculateLongestDrunkDuration(member.monthlyDrinks, member.profile);
                    displayValue = `${value.toFixed(1)}h`;
                    break;
                case 'most_wine':
                    value = totalVolumeLiters(member.monthlyDrinks, isWine);
                    displayValue = `${value.toFixed(2)}L`;
                    break;
                case 'most_chugs':
                    value = member.monthlyDrinks.filter(d => d.isChug).length;
                    displayValue = `${value} ${language === 'fr' ? 'cul-sec' : 'chugs'}`;
                    break;
                case 'most_champagne':
                    value = totalVolumeLiters(member.monthlyDrinks, isChampagne);
                    displayValue = `${value.toFixed(2)}L`;
                    break;
                case 'most_beer':
                    value = totalVolumeLiters(member.monthlyDrinks, isBeer);
                    displayValue = `${value.toFixed(2)}L`;
                    break;
                case 'most_gin':
                    value = volumeByCategory(member.monthlyDrinks, GIN_KEYWORDS);
                    displayValue = `${value.toFixed(2)}L`;
                    break;
                case 'least_drinks':
                    value = totalAlcoholGrams(member.monthlyDrinks);
                    displayValue = value === 0
                        ? (language === 'fr' ? '0 verre' : '0 drinks')
                        : `${value.toFixed(0)}g ${language === 'fr' ? 'd\'alcool pur' : 'pure alcohol'}`;
                    break;
                case 'most_tequila':
                    value = volumeByCategory(member.monthlyDrinks, TEQUILA_KEYWORDS);
                    displayValue = `${value.toFixed(2)}L`;
                    break;
                case 'most_whisky':
                    value = volumeByCategory(member.monthlyDrinks, WHISKY_KEYWORDS);
                    displayValue = `${value.toFixed(2)}L`;
                    break;
            }

            if (awardDef.category === 'least_drinks') {
                // Least: lowest value wins
                if (value < bestValue) {
                    bestValue = value;
                    bestUid = member.uid;
                    bestName = member.displayName;
                    bestPhoto = member.photoURL;
                    bestDisplayValue = displayValue;
                }
            } else {
                // Most: highest value wins (must be > 0)
                if (value > bestValue && value > 0) {
                    bestValue = value;
                    bestUid = member.uid;
                    bestName = member.displayName;
                    bestPhoto = member.photoURL;
                    bestDisplayValue = displayValue;
                }
            }
        }

        // Only award if there's a winner
        if (bestUid) {
            awards.push({
                awardId: awardDef.id,
                recipientUid: bestUid,
                recipientName: bestName,
                recipientPhoto: bestPhoto,
                value: bestDisplayValue,
                month,
                year,
            });
        }
    }

    return awards;
};

export const useAwards = () => {
    const [awards, setAwards] = useState<ComputedAward[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number }>(() => {
        const now = new Date();
        // Default to previous month, but not before launch
        let prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        let prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

        if (prevYear < APP_LAUNCH_YEAR || (prevYear === APP_LAUNCH_YEAR && prevMonth < APP_LAUNCH_MONTH)) {
            prevMonth = APP_LAUNCH_MONTH;
            prevYear = APP_LAUNCH_YEAR;
        }

        return { month: prevMonth, year: prevYear };
    });

    const fetchGroupAwards = async (
        groupId: string,
        month: number,
        year: number,
        language: 'en' | 'fr'
    ) => {
        if (year < APP_LAUNCH_YEAR || (year === APP_LAUNCH_YEAR && month < APP_LAUNCH_MONTH)) {
            setAwards([]);
            setSelectedMonth({ month, year });
            return;
        }

        setLoading(true);
        try {
            // 1. Get group member IDs
            const groupSnap = await getDoc(doc(db, "groups", groupId));
            if (!groupSnap.exists()) {
                setAwards([]);
                return;
            }
            const memberIds: string[] = groupSnap.data().memberIds || [];

            // 2. Fetch each member's profile and drinks
            const membersData: MemberData[] = [];

            // Batch fetch profiles
            const profilesQuery = query(
                collection(db, "users"),
                where("__name__", "in", memberIds.slice(0, 30))
            );
            const profilesSnap = await getDocs(profilesQuery);
            const profilesMap: Record<string, UserProfile> = {};
            profilesSnap.forEach((d: any) => {
                profilesMap[d.id] = d.data() as UserProfile;
            });

            // Batch fetch drinks
            const drinksQuery = query(
                collection(db, "drinks"),
                where("__name__", "in", memberIds.slice(0, 30))
            );
            const drinksSnap = await getDocs(drinksQuery);
            const drinksMap: Record<string, Drink[]> = {};
            drinksSnap.forEach((d: any) => {
                drinksMap[d.id] = (d.data()?.list || []) as Drink[];
            });

            // Assemble member data
            for (const uid of memberIds) {
                const profile = profilesMap[uid];
                if (!profile) continue;

                membersData.push({
                    uid,
                    displayName: profile.username || profile.displayName || 'Anonymous',
                    photoURL: profile.customPhotoURL || profile.photoURL || '',
                    drinks: drinksMap[uid] || [],
                    profile,
                });
            }

            // 3. Compute awards
            const computed = computeMonthlyAwards(membersData, month, year, language);
            setAwards(computed);
            setSelectedMonth({ month, year });
        } catch (err) {
            console.error("Error computing awards:", err);
            setAwards([]);
        } finally {
            setLoading(false);
        }
    };

    const claimAward = async (uid: string, groupId: string, award: ComputedAward) => {
        try {
            const groupSnap = await getDoc(doc(db, "groups", groupId));
            const groupName = groupSnap.data()?.name || '';
            const userRef = doc(db, "users", uid);

            const wonAward: WonAward = {
                awardId: award.awardId,
                groupId,
                groupName,
                month: award.month,
                year: award.year,
                value: String(award.value),
                wonAt: Date.now(),
            };

            await updateDoc(userRef, {
                wonAwards: arrayUnion(wonAward)
            });
            return true;
        } catch (e) {
            console.error("Error claiming award:", e);
            return false;
        }
    };

    return {
        awards,
        loading,
        selectedMonth,
        fetchGroupAwards,
        claimAward,
        appLaunch: { month: APP_LAUNCH_MONTH, year: APP_LAUNCH_YEAR }
    };
};

