import React, { useMemo } from 'react';
import { Drink, UserProfile } from '../types';
import { X, Beer, Clock, Flame, Trophy, Calendar } from 'lucide-react';
import { METABOLISM_RATE, METABOLISM_RATES } from '../constants';

interface StatsModalProps {
    drinks: Drink[];
    user: UserProfile;
    onClose: () => void;
}

// Drink icon mapping
const drinkIcons: Record<string, string> = {
    beer: '🍺',
    wine: '🍷',
    cocktail: '🍸',
    spirit: '🥃',
    other: '🥤'
};

export const StatsModal: React.FC<StatsModalProps> = ({ drinks, user, onClose }) => {
    const isFrench = user.language === 'fr';

    const t = {
        title: isFrench ? 'Mes Statistiques' : 'My Statistics',
        favoriteDrink: isFrench ? 'Boisson Préférée' : 'Favorite Drink',
        totalHours: isFrench ? 'Heures Alcoolisé' : 'Hours Intoxicated',
        longestSession: isFrench ? 'Plus Longue Session' : 'Longest Session',
        drinkingStreak: isFrench ? 'Streak de Jours' : 'Day Streak',
        totalDrinks: isFrench ? 'Total de Verres' : 'Total Drinks',
        noData: isFrench ? 'Pas encore de données' : 'No data yet',
        times: isFrench ? 'fois' : 'times',
        hours: isFrench ? 'heures' : 'hours',
        days: isFrench ? 'jours' : 'days',
        consecutiveDays: isFrench ? 'jours consécutifs' : 'consecutive days',
        consecutiveHours: isFrench ? 'heures d\'affilée' : 'hours straight',
        currentStreak: isFrench ? 'Streak actuelle' : 'Current streak',
    };

    const stats = useMemo(() => {
        if (drinks.length === 0) return null;

        // 1. Favorite drink (most consumed by name)
        const drinkCounts: Record<string, { count: number; type: string; icon?: string }> = {};
        drinks.forEach(d => {
            const key = d.name;
            if (!drinkCounts[key]) {
                drinkCounts[key] = { count: 0, type: d.type || 'other', icon: d.icon };
            }
            drinkCounts[key].count++;
        });
        const sortedDrinks = Object.entries(drinkCounts).sort((a, b) => b[1].count - a[1].count);
        const favoriteDrink = sortedDrinks[0];

        // 2. Total hours intoxicated
        // Group drinks by "session" — a session is active when BAC > 0
        // Use a simplified Widmark metabolism model
        const eliminationRate = user.habitLevel ? METABOLISM_RATES[user.habitLevel] : METABOLISM_RATE;
        const METABOLISM_RATE_PER_HOUR = eliminationRate; // % per hour
        const ALCOHOL_DENSITY = 0.789;
        const GENDER_R = user.gender === 'male' ? 0.68 : 0.55;
        const weight = user.weightKg || 70;

        // Sort all drinks by timestamp
        const sortedByTime = [...drinks].sort((a, b) => a.timestamp - b.timestamp);

        // Simulate BAC over time to determine intoxicated periods
        const STEP_MS = 15 * 60 * 1000; // 15-minute steps
        const metabolismPerStep = (METABOLISM_RATE_PER_HOUR / 60) * 15; // per 15 min

        let totalIntoxicatedMs = 0;
        let longestSessionMs = 0;
        let currentSessionMs = 0;

        if (sortedByTime.length > 0) {
            const simStart = sortedByTime[0].timestamp;
            // End simulation at last drink + 24h (to allow full metabolization)
            const simEnd = sortedByTime[sortedByTime.length - 1].timestamp + 24 * 60 * 60 * 1000;

            // Pre-calculate drink absorption events
            const absorptionDelayMs = 45 * 60 * 1000; // 45 min absorption
            const drinkEvents = sortedByTime.map(d => {
                const alcoholGrams = d.volumeMl * (d.abv / 100) * ALCOHOL_DENSITY;
                const potentialBac = (alcoholGrams / (weight * GENDER_R)) / 10;
                const consumptionMs = d.isChug ? 0 : 15 * 60 * 1000; // ~15 min avg
                const windowMs = consumptionMs + absorptionDelayMs;
                return {
                    start: d.timestamp,
                    end: d.timestamp + windowMs,
                    bacPerMs: windowMs > 0 ? potentialBac / windowMs : potentialBac
                };
            });

            let bac = 0;

            for (let t = simStart; t <= simEnd; t += STEP_MS) {
                // Add absorbed alcohol
                let addedBac = 0;
                for (const event of drinkEvents) {
                    if (t >= event.start && t < event.end) {
                        addedBac += event.bacPerMs * STEP_MS;
                    }
                }
                bac += addedBac;

                // Metabolize
                if (bac > 0) {
                    bac = Math.max(0, bac - metabolismPerStep);
                }

                if (bac > 0.001) { // threshold
                    totalIntoxicatedMs += STEP_MS;
                    currentSessionMs += STEP_MS;
                } else {
                    if (currentSessionMs > longestSessionMs) {
                        longestSessionMs = currentSessionMs;
                    }
                    currentSessionMs = 0;
                }
            }
            // Check last session
            if (currentSessionMs > longestSessionMs) {
                longestSessionMs = currentSessionMs;
            }
        }

        const totalIntoxicatedHours = Math.round(totalIntoxicatedMs / (60 * 60 * 1000));
        const longestSessionHours = Math.round((longestSessionMs / (60 * 60 * 1000)) * 10) / 10;

        // 3. Drinking streak (consecutive days)
        // Get unique days user had at least one drink
        const drinkDays = new Set<string>();
        drinks.forEach(d => {
            const date = new Date(d.timestamp);
            if (drinkDays && typeof drinkDays.add === 'function') {
                drinkDays.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
            }
        });

        const dayStrings = Array.from(drinkDays).sort();

        // Calculate current streak (count backwards from today)
        let currentStreak = 0;
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Start checking from today or yesterday (in case user hasn't drunk today yet)
        let checkDate = new Date(today);
        // First check if today is a drink day
        if (!drinkDays.has(todayStr)) {
            // check from yesterday
            checkDate.setDate(checkDate.getDate() - 1);
        }

        while (true) {
            const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
            if (drinkDays.has(dateStr)) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        // Calculate max streak ever
        let maxStreak = 0;
        let tempStreak = 1;
        for (let i = 1; i < dayStrings.length; i++) {
            const prev = new Date(dayStrings[i - 1]);
            const curr = new Date(dayStrings[i]);
            const diffDays = Math.round((curr.getTime() - prev.getTime()) / (86400000));
            if (diffDays === 1) {
                tempStreak++;
            } else {
                if (tempStreak > maxStreak) maxStreak = tempStreak;
                tempStreak = 1;
            }
        }
        if (tempStreak > maxStreak) maxStreak = tempStreak;

        return {
            favoriteDrink: favoriteDrink ? {
                name: favoriteDrink[0],
                count: favoriteDrink[1].count,
                type: favoriteDrink[1].type,
                icon: favoriteDrink[1].icon
            } : null,
            totalIntoxicatedHours,
            longestSessionHours,
            currentStreak,
            maxStreak,
            totalDrinks: drinks.length,
            uniqueDays: drinkDays.size
        };
    }, [drinks, user]);

    return (
        <div className="modal-overlay">
            <div
                className="modal-container w-full max-w-lg rounded-[40px] relative"
                style={{ maxHeight: '85vh' }}
            >
                {/* Glow decoration */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-2 relative z-10">
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-2xl">
                            <Trophy size={22} className="text-purple-400" />
                        </div>
                        {t.title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 pt-4 overflow-y-auto no-scrollbar relative z-10" style={{ maxHeight: 'calc(85vh - 80px)' }}>
                    {!stats ? (
                        <div className="text-center py-12">
                            <Beer size={48} className="text-white/20 mx-auto mb-4" />
                            <p className="text-white/40 font-bold">{t.noData}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Total Drinks Counter */}
                            <div className="glass-panel-3d p-5 rounded-[28px] flex items-center gap-4">
                                <div className="p-3 bg-amber-500/20 rounded-2xl">
                                    <Beer size={24} className="text-amber-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{t.totalDrinks}</p>
                                    <p className="text-3xl font-black text-white">{stats.totalDrinks}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold">{stats.uniqueDays} {t.days}</p>
                                </div>
                            </div>

                            {/* Favorite Drink */}
                            {stats.favoriteDrink && (
                                <div className="glass-panel-3d p-5 rounded-[28px] relative overflow-hidden">
                                    <div className="absolute -top-2 -right-2 text-6xl opacity-10 pointer-events-none">
                                        {stats.favoriteDrink.icon || drinkIcons[stats.favoriteDrink.type] || '🍹'}
                                    </div>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                                        <Trophy size={10} className="text-yellow-400" />
                                        {t.favoriteDrink}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{stats.favoriteDrink.icon || drinkIcons[stats.favoriteDrink.type] || '🍹'}</span>
                                        <div>
                                            <p className="text-xl font-black text-white">{stats.favoriteDrink.name}</p>
                                            <p className="text-xs text-white/40 font-bold">{stats.favoriteDrink.count} {t.times}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Hours & Session Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Total Hours Intoxicated */}
                                <div className="glass-panel-3d p-5 rounded-[28px] flex flex-col items-center text-center">
                                    <div className="p-3 bg-blue-500/20 rounded-2xl mb-3">
                                        <Clock size={20} className="text-blue-400" />
                                    </div>
                                    <p className="text-3xl font-black text-white">{stats.totalIntoxicatedHours}</p>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1">{t.hours}</p>
                                    <p className="text-[9px] text-white/20 uppercase tracking-wider font-bold mt-0.5">{t.totalHours}</p>
                                </div>

                                {/* Longest Session */}
                                <div className="glass-panel-3d p-5 rounded-[28px] flex flex-col items-center text-center">
                                    <div className="p-3 bg-red-500/20 rounded-2xl mb-3">
                                        <Flame size={20} className="text-red-400" />
                                    </div>
                                    <p className="text-3xl font-black text-white">{stats.longestSessionHours}</p>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1">{t.consecutiveHours}</p>
                                    <p className="text-[9px] text-white/20 uppercase tracking-wider font-bold mt-0.5">{t.longestSession}</p>
                                </div>
                            </div>

                            {/* Drinking Streak */}
                            <div className="glass-panel-3d p-5 rounded-[28px] relative overflow-hidden">
                                <div className="absolute -top-4 -right-4 text-7xl opacity-5 pointer-events-none">🔥</div>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
                                    <Calendar size={10} className="text-orange-400" />
                                    {t.drinkingStreak}
                                </p>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black text-white">{stats.currentStreak}</span>
                                            <span className="text-sm text-white/30 font-bold">{t.days}</span>
                                        </div>
                                        <p className="text-xs text-white/40 font-bold mt-1">{t.currentStreak}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Record</p>
                                        <p className="text-2xl font-black text-amber-400">{stats.maxStreak}</p>
                                        <p className="text-[10px] text-white/30 font-bold">{t.consecutiveDays}</p>
                                    </div>
                                </div>
                                {/* Streak fire dots */}
                                <div className="flex gap-1 mt-4">
                                    {Array.from({ length: Math.min(stats.currentStreak, 30) }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="h-2 flex-1 rounded-full transition-all"
                                            style={{
                                                background: `linear-gradient(to right, #f97316, #ef4444)`,
                                                opacity: 0.3 + (i / Math.min(stats.currentStreak, 30)) * 0.7
                                            }}
                                        />
                                    ))}
                                    {stats.currentStreak === 0 && (
                                        <div className="h-2 flex-1 rounded-full bg-white/5" />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
