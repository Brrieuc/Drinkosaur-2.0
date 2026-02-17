import React, { useState, useEffect, useMemo } from 'react';
import { Globe, Zap, Calendar, Loader2, Users, TrendingUp, Beer, Wine, Martini, Trophy, Flame, Lock } from 'lucide-react';
import { ProfilePhoto } from './DrinkosaurPass';
import { calculateBac } from '../services/bacService';
import { METABOLISM_RATE, METABOLISM_RATES, THEME_COLORS } from '../constants';
import { UserProfile } from '../types';
import {
    GlobalLiveStats,
    GlobalMonthlyStats,
    MonthlyUserStat,
    LiveUser,
} from '../hooks/useGlobalStats';

type GlobeTab = 'live' | 'month';

const MONTH_NAMES_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface GlobalDashboardProps {
    liveStats: GlobalLiveStats | null;
    monthlyStats: GlobalMonthlyStats | null;
    loadingLive: boolean;
    loadingMonthly: boolean;
    onFetchLive: () => void;
    onFetchMonthly: () => void;
    language: 'en' | 'fr';
    myUid: string;
    onSelectUser: (user: LiveUser | MonthlyUserStat) => void;
}

export const GlobalDashboard: React.FC<GlobalDashboardProps> = ({
    liveStats,
    monthlyStats,
    loadingLive,
    loadingMonthly,
    onFetchLive,
    onFetchMonthly,
    language,
    myUid,
    onSelectUser
}) => {
    const [tab, setTab] = useState<GlobeTab>('live');
    const isFrench = language === 'fr';

    // Live update ticker (every minute)
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const i = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(i);
    }, []);
    const now = new Date();
    const monthNames = isFrench ? MONTH_NAMES_FR : MONTH_NAMES_EN;

    const t = {
        title: isFrench ? 'Classement Global' : 'Global Leaderboard',
        live: 'Live',
        month: isFrench ? 'Mois' : 'Month',
        notSober: isFrench ? 'actuellement pas sobres' : 'currently not sober',
        avgBac: isFrench ? 'Taux moyen' : 'Average BAC',
        topUsers: isFrench ? 'Top 10 — Plus haut taux' : 'Top 10 — Highest BAC',
        topGroups: isFrench ? 'Top 3 Groupes — Taux moyen' : 'Top 3 Groups — Average BAC',
        topBeer: isFrench ? 'Top 5 — Bière' : 'Top 5 — Beer',
        topWine: isFrench ? 'Top 5 — Vin' : 'Top 5 — Wine',
        topSpirits: isFrench ? 'Top 5 — Spiritueux' : 'Top 5 — Spirits',
        topMonthGroups: isFrench ? 'Top 3 Groupes — Consommation' : 'Top 3 Groups — Consumption',
        noData: isFrench ? 'Aucune donnée pour le moment' : 'No data yet',
        members: isFrench ? 'membres' : 'members',
        drinks: isFrench ? 'consos' : 'drinks',
        pureAlcohol: isFrench ? 'ml d\'alcool pur' : 'ml pure alcohol',
        loading: isFrench ? 'Chargement...' : 'Loading...',
        hiddenBac: isFrench ? 'Amis seulement' : 'Friends only',
        anonymous: isFrench ? 'Anonyme' : 'Anonymous',
    };

    // Fetch data on tab switch
    useEffect(() => {
        if (tab === 'live' && !liveStats && !loadingLive) {
            onFetchLive();
        } else if (tab === 'month' && !monthlyStats && !loadingMonthly) {
            onFetchMonthly();
        }
    }, [tab]);

    // --- RECALCULATED STATS (Top Level Hook) ---
    const reLiveStats = useMemo(() => {
        if (!liveStats) return null;

        const recalculatedUsers = liveStats.topUsers.map(u => {
            let currentBac = u.currentBac;
            let statusMessage = u.statusMessage;
            let color = u.color;

            // 1. Full recalculation if data is available
            if (u.drinks && u.drinks.length > 0 && u.weightKg) {
                const live = calculateBac(u.drinks, {
                    weightKg: u.weightKg,
                    gender: u.gender,
                    drinkingSpeed: u.drinkingSpeed || 'average',
                    habitLevel: u.habitLevel || 'average',
                    language: language
                } as UserProfile);
                currentBac = live.currentBac;
                statusMessage = live.statusMessage;
                color = live.color;
            }
            // 2. Linear decay if data is missing or stale
            else if (u.lastUpdate && u.currentBac > 0) {
                const hoursPassed = (Date.now() - u.lastUpdate) / (1000 * 60 * 60);
                const metabolism = u.habitLevel ? METABOLISM_RATES[u.habitLevel] : METABOLISM_RATE;
                const reduction = hoursPassed * metabolism;
                currentBac = Math.max(0, u.currentBac - reduction);

                if (currentBac === 0) {
                    statusMessage = isFrench ? 'Sobre' : 'Sober';
                    color = THEME_COLORS.safe;
                }
            }

            return { ...u, currentBac, statusMessage, color };
        });

        // Re-sort in case a user plummeted faster than another
        const sortedUsers = [...recalculatedUsers].sort((a, b) => b.currentBac - a.currentBac);

        // Recalculate average for top users (approximation of global shift)
        const newSum = sortedUsers.reduce((acc, u) => acc + u.currentBac, 0);
        const newAvg = sortedUsers.length > 0 ? newSum / sortedUsers.length : 0;

        return {
            ...liveStats,
            avgBacNotSober: newAvg, // Update average to reflect decay
            topUsers: sortedUsers
        };
    }, [liveStats, tick, language, isFrench]);

    const formatBac = (bac: number) => {
        const gL = (bac * 10).toFixed(2);
        return `${gL} g/L`;
    };

    const getRankStyle = (index: number) => {
        if (index === 0) return { bg: 'from-amber-500/20 to-yellow-600/10', border: 'border-amber-500/40', icon: '🥇', textColor: 'text-amber-400' };
        if (index === 1) return { bg: 'from-gray-400/15 to-gray-500/8', border: 'border-gray-400/30', icon: '🥈', textColor: 'text-gray-300' };
        if (index === 2) return { bg: 'from-orange-700/15 to-orange-800/8', border: 'border-orange-600/30', icon: '🥉', textColor: 'text-orange-400' };
        return { bg: 'from-white/5 to-white/[0.02]', border: 'border-white/10', icon: '', textColor: 'text-white/60' };
    };

    /** ABSOLUTE RULE: BAC is only visible to friends (and to yourself) */
    const canSeeBac = (user: LiveUser | MonthlyUserStat): boolean => {
        if ('isMe' in user && user.isMe) return true;
        if ('isFriend' in user && user.isFriend) return true;
        return false;
    };


    // ─── LIVE TAB ────────────────────────────────────────────
    const renderLive = () => {
        if (loadingLive) {
            return (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Loader2 className="animate-spin text-emerald-400" size={48} />
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{t.loading}</p>
                </div>
            );
        }

        if (!liveStats) {
            return (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Globe size={48} className="text-white/20" />
                    <p className="text-white/40 text-sm font-bold">{t.noData}</p>
                </div>
            );
        }



        return (
            <div className="space-y-6 animate-fade-in">
                {/* Hero Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Total Users */}
                    <div className="glass-panel-3d rounded-[28px] p-5 relative overflow-hidden col-span-2 sm:col-span-1">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none" />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-2">
                                <Users size={14} className="text-blue-400" />
                                <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">{isFrench ? 'Communauté' : 'Community'}</span>
                            </div>
                            <p className="text-4xl font-black text-blue-400 leading-none">
                                {reLiveStats?.totalUsers || 0}
                            </p>
                            <p className="text-[10px] text-white/30 font-bold mt-2 uppercase tracking-wider leading-tight">
                                {isFrench ? 'comptes créés' : 'accounts created'}
                            </p>
                        </div>
                    </div>

                    {/* Total not sober */}
                    <div className="glass-panel-3d rounded-[28px] p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">Live</span>
                            </div>
                            <p className="text-4xl font-black text-emerald-400 leading-none">
                                {reLiveStats?.totalNotSober || 0}
                            </p>
                            <p className="text-[10px] text-white/30 font-bold mt-2 uppercase tracking-wider leading-tight">
                                {t.notSober}
                            </p>
                        </div>
                    </div>

                    {/* Average BAC */}
                    <div className="glass-panel-3d rounded-[28px] p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-[40px] pointer-events-none" />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <TrendingUp size={16} className="text-red-400" />
                                </div>
                            </div>
                            <p className="text-4xl font-black text-red-500 leading-none">
                                {formatBac(reLiveStats?.avgBacNotSober || 0)}
                            </p>
                            <p className="text-[10px] text-white/30 font-bold mt-2 uppercase tracking-wider leading-tight">
                                {t.avgBac}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Top 10 Users */}
                <div>
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Flame size={16} className="text-orange-400" />
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">{t.topUsers}</h3>
                    </div>

                    {!reLiveStats || reLiveStats.topUsers.length === 0 ? (
                        <div className="glass-panel-3d rounded-3xl p-6 text-center">
                            <p className="text-white/30 text-xs font-bold">{t.noData}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {reLiveStats.topUsers.map((user, idx) => {
                                const style = getRankStyle(idx);
                                const isMe = user.uid === myUid;
                                const showBac = canSeeBac(user);
                                return (
                                    <div
                                        key={user.uid}
                                        onClick={() => onSelectUser(user)}
                                        className={`rounded-2xl p-4 flex items-center gap-3 border bg-gradient-to-r ${style.bg} ${style.border} ${isMe ? 'ring-1 ring-amber-400/40' : ''} cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all`}
                                    >
                                        {/* Rank */}
                                        <div className="w-8 text-center shrink-0">
                                            {style.icon ? (
                                                <span className="text-xl">{style.icon}</span>
                                            ) : (
                                                <span className="text-sm font-black text-white/30">#{idx + 1}</span>
                                            )}
                                        </div>

                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            {user.photoURL ? (
                                                <ProfilePhoto
                                                    photoURL={user.photoURL}
                                                    effect={user.drinkosaurPassConfig?.profileEffect}
                                                    size="w-10 h-10"
                                                    borderColor="rgba(255,255,255,0.1)"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-sm font-black border border-white/10">
                                                    {(user.username || 'A').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a0a15]" style={{ backgroundColor: user.color }} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-black truncate ${isMe ? 'text-amber-400' : 'text-white'}`}>
                                                @{user.username || 'joueur'}
                                                {isMe && <span className="ml-1 text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-black">{isFrench ? 'VOUS' : 'YOU'}</span>}
                                            </p>
                                            {showBac && (
                                                <p className="text-[10px] text-white/30 font-bold mt-0.5">{user.statusMessage}</p>
                                            )}
                                        </div>

                                        {/* BAC — ONLY for friends and self */}
                                        <div className="text-right shrink-0">
                                            {showBac ? (
                                                <p className={`text-lg font-black ${style.textColor}`}>{formatBac(user.currentBac)}</p>
                                            ) : (
                                                <div className="flex items-center gap-1 text-white/15">
                                                    <Lock size={12} />
                                                    <span className="text-[9px] font-bold uppercase tracking-wider">{t.hiddenBac}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Top 3 Groups */}
                <div>
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Users size={16} className="text-blue-400" />
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">{t.topGroups}</h3>
                    </div>

                    {liveStats.topGroups.length === 0 ? (
                        <div className="glass-panel-3d rounded-3xl p-6 text-center">
                            <p className="text-white/30 text-xs font-bold">{t.noData}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {liveStats.topGroups.map((group, idx) => {
                                const style = getRankStyle(idx);
                                return (
                                    <div
                                        key={group.groupId}
                                        className={`rounded-[24px] p-5 flex items-center gap-4 border bg-gradient-to-r ${style.bg} ${style.border} transition-all`}
                                    >
                                        <div className="w-8 text-center shrink-0">
                                            <span className="text-xl">{style.icon}</span>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-2xl shrink-0">
                                            {group.groupIcon || <Users size={24} className="text-blue-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-white truncate">{group.groupName}</p>
                                            <p className="text-[10px] text-white/30 font-bold mt-0.5">{group.memberCount} {t.members}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`text-lg font-black ${style.textColor}`}>{formatBac(group.avgBac)}</p>
                                            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">{isFrench ? 'moy.' : 'avg.'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ─── MONTH TAB ───────────────────────────────────────────
    const renderMonth = () => {
        if (loadingMonthly) {
            return (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Loader2 className="animate-spin text-purple-400" size={48} />
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{t.loading}</p>
                </div>
            );
        }

        if (!monthlyStats) {
            return (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Calendar size={48} className="text-white/20" />
                    <p className="text-white/40 text-sm font-bold">{t.noData}</p>
                </div>
            );
        }

        const renderUserRanking = (
            title: string,
            icon: React.ReactNode,
            users: MonthlyUserStat[],
            accentColor: string
        ) => (
            <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                    {icon}
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">{title}</h3>
                </div>
                {users.length === 0 ? (
                    <div className="glass-panel-3d rounded-3xl p-5 text-center">
                        <p className="text-white/30 text-xs font-bold">{t.noData}</p>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {users.map((user, idx) => {
                            const style = getRankStyle(idx);
                            const isMe = user.uid === myUid;
                            return (
                                <div
                                    key={user.uid}
                                    onClick={() => onSelectUser(user)}
                                    className={`rounded-2xl p-3.5 flex items-center gap-3 border bg-gradient-to-r ${style.bg} ${style.border} ${isMe ? 'ring-1 ring-amber-400/40' : 'cursor-pointer hover:brightness-110 active:scale-[0.98]'}`}
                                >
                                    <div className="w-7 text-center shrink-0">
                                        {style.icon ? (
                                            <span className="text-lg">{style.icon}</span>
                                        ) : (
                                            <span className="text-xs font-black text-white/30">#{idx + 1}</span>
                                        )}
                                    </div>
                                    {user.photoURL ? (
                                        <ProfilePhoto
                                            photoURL={user.photoURL}
                                            effect={user.drinkosaurPassConfig?.profileEffect}
                                            size="w-9 h-9"
                                            borderColor="rgba(255,255,255,0.1)"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-xs font-black border border-white/10 shrink-0">
                                            {(user.username || 'A').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold truncate ${isMe ? 'text-amber-400' : 'text-white'}`}>
                                            @{user.username || 'joueur'}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-base font-black`} style={{ color: accentColor }}>{user.value.toFixed(1)}</p>
                                        <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest">{isFrench ? 'Litres' : 'Liters'}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Month badge */}
                <div className="flex justify-center">
                    <div className="bg-white/5 px-5 py-2 rounded-full border border-white/10">
                        <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                            {monthNames[now.getMonth()]} {now.getFullYear()}
                        </span>
                    </div>
                </div>

                {/* Top 5 per category */}
                {renderUserRanking(
                    t.topBeer,
                    <Beer size={16} className="text-amber-400" />,
                    monthlyStats.topBeer,
                    '#fbbf24'
                )}

                {renderUserRanking(
                    t.topWine,
                    <Wine size={16} className="text-rose-400" />,
                    monthlyStats.topWine,
                    '#f43f5e'
                )}

                {renderUserRanking(
                    t.topSpirits,
                    <Martini size={16} className="text-violet-400" />,
                    monthlyStats.topSpirits,
                    '#a78bfa'
                )}

                {/* Top 3 groups by consumption */}
                <div>
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Trophy size={16} className="text-emerald-400" />
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">{t.topMonthGroups}</h3>
                    </div>
                    {monthlyStats.topGroups.length === 0 ? (
                        <div className="glass-panel-3d rounded-3xl p-6 text-center">
                            <p className="text-white/30 text-xs font-bold">{t.noData}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {monthlyStats.topGroups.map((group, idx) => {
                                const style = getRankStyle(idx);
                                return (
                                    <div
                                        key={group.groupId}
                                        className={`rounded-[24px] p-5 flex items-center gap-4 border bg-gradient-to-r ${style.bg} ${style.border}`}
                                    >
                                        <div className="w-8 text-center shrink-0">
                                            <span className="text-xl">{style.icon}</span>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-2xl shrink-0">
                                            {group.groupIcon || <Users size={24} className="text-emerald-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-white truncate">{group.groupName}</p>
                                            <p className="text-[10px] text-white/30 font-bold mt-0.5">{group.memberCount} {t.members}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`text-base font-black ${style.textColor}`}>{Math.round(group.totalAlcoholMl)}</p>
                                            <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest">{t.pureAlcohol}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="px-6 pt-6 pb-2">
                <div className="flex items-center justify-center gap-3 mb-5">
                    <Globe size={22} className="text-cyan-400" />
                    <h1 className="text-xl font-black text-white uppercase tracking-wider">{t.title}</h1>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
                    <button
                        onClick={() => setTab('live')}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${tab === 'live'
                            ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                            : 'text-white/30 hover:text-white/50'
                            }`}
                    >
                        <Zap size={14} />
                        {t.live}
                        {tab === 'live' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                    </button>
                    <button
                        onClick={() => setTab('month')}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${tab === 'month'
                            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                            : 'text-white/30 hover:text-white/50'
                            }`}
                    >
                        <Calendar size={14} />
                        {t.month}
                    </button>
                </div>
            </div>

            {/* Refresh button */}
            <div className="px-6 py-2 flex justify-end">
                <button
                    onClick={() => tab === 'live' ? onFetchLive() : onFetchMonthly()}
                    disabled={tab === 'live' ? loadingLive : loadingMonthly}
                    className="text-[10px] text-white/20 font-black uppercase tracking-widest hover:text-white/40 transition-colors disabled:opacity-30 flex items-center gap-1"
                >
                    <Loader2 size={10} className={(tab === 'live' ? loadingLive : loadingMonthly) ? 'animate-spin' : ''} />
                    {isFrench ? 'Rafraîchir' : 'Refresh'}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-40 no-scrollbar scroll-smooth">
                {tab === 'live' ? renderLive() : renderMonth()}
            </div>
        </div>
    );
};
