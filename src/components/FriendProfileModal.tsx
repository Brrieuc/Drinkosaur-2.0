import React, { useMemo, useState } from 'react';
import { X, Clock, Zap, History } from 'lucide-react';
import { Drink, UserProfile } from '../types';
import { BacChartModal } from './BacChartModal';
import { calculateBac } from '../services/bacService';

interface FriendProfileModalProps {
    friend: {
        uid: string;
        displayName: string;
        photoURL?: string;
        currentBac: number;
        statusMessage: string;
        color: string;
    };
    friendDrinks: Drink[];
    friendProfile: UserProfile;
    onClose: () => void;
    language: 'en' | 'fr';
}

export const FriendProfileModal: React.FC<FriendProfileModalProps> = ({
    friend,
    friendDrinks,
    friendProfile,
    onClose,
    language
}) => {
    const [showChart, setShowChart] = useState(false);
    const isFrench = language === 'fr';

    const t = {
        title: isFrench ? "Profil de l'ami" : "Friend Profile",
        bacLevel: isFrench ? 'Taux Alcool' : 'BAC Level',
        soberAt: isFrench ? 'Sobre à' : 'Sober At',
        limitLoad: isFrench ? 'Charge Limite' : 'Limit Load',
        unitDesc: isFrench ? 'Grammes par Litre' : 'g/100ml',
        recentDrinks: isFrench ? 'Dernières consommations' : 'Recent Drinks',
        noDrinks: isFrench ? 'Aucune conso active' : 'No active drinks',
        peak: isFrench ? 'Pic' : 'Peak',
        at: isFrench ? 'à' : '@'
    };

    const displayValue = isFrench ? friend.currentBac * 10 : friend.currentBac;
    const displayUnit = isFrench ? 'g/L' : '%';
    const displayDecimals = isFrench ? 2 : 3;

    // We don't have the full BacStatus for the friend (soberTime, peak) unless we calculate it.
    // For simplicity, we can calculate it on the fly or just show the current value.
    // Given the request asks for "the same bubble", we should ideally show the same info.
    // We have friendProfile and friendDrinks, so we can use calculateBac.

    // We'll import calculateBac from services
    const fullStatus = useMemo(() => calculateBac(friendDrinks, friendProfile), [friendDrinks, friendProfile]);

    const liquidHeight = Math.min((fullStatus.currentBac / 0.20) * 100, 100);
    // Dynamic gradient based on consumed drinks
    const { gradientStyle, glowStyle } = useMemo(() => {
        const defaultGradient = 'linear-gradient(to top, #22d3ee, #3b82f6, #6366f1)';

        if (fullStatus.currentBac <= 0 || friendDrinks.length === 0) {
            return {
                gradientStyle: { background: defaultGradient },
                glowStyle: { background: 'rgb(59, 130, 246)' }
            };
        }

        const now = Date.now();
        const activeDrinks = friendDrinks
            .filter(d => d.timestamp > now - 12 * 60 * 60 * 1000)
            .sort((a, b) => a.timestamp - b.timestamp);

        const colors = activeDrinks
            .map(d => d.color || '#FCD34D')
            .filter((c, i, self) => self.indexOf(c) === i);

        if (colors.length === 0) {
            return {
                gradientStyle: { background: defaultGradient },
                glowStyle: { background: 'rgb(59, 130, 246)' }
            };
        }

        if (colors.length === 1) {
            const c = colors[0];
            return {
                gradientStyle: { background: `linear-gradient(to top, ${c}, ${c}dd)` },
                glowStyle: { background: c }
            };
        }

        const gradientStr = `linear-gradient(to top, ${colors.join(', ')})`;
        return {
            gradientStyle: { background: gradientStr },
            glowStyle: { background: colors[colors.length - 1] }
        };
    }, [friendDrinks, fullStatus.currentBac]);

    const soberTimeStr = useMemo(() => {
        if (!fullStatus.soberTimestamp) return null;
        return new Date(fullStatus.soberTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, [fullStatus.soberTimestamp]);

    const activeDrinks = useMemo(() => {
        const now = Date.now();
        // Show drinks from the last 12 hours that are still contributing (roughly)
        return friendDrinks
            .filter(d => d.timestamp > now - 12 * 60 * 60 * 1000)
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [friendDrinks]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fade-in">
            {showChart && (
                <BacChartModal drinks={friendDrinks} user={friendProfile} onClose={() => setShowChart(false)} />
            )}

            <div className="w-full max-w-lg bg-[#0f0f13] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-slide-up relative">

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors z-[110]">
                    <X size={20} />
                </button>

                <div className="flex-1 overflow-y-auto no-scrollbar p-6">
                    {/* Header with Friend Info */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative mb-4">
                            <div className="absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse" style={{ backgroundColor: fullStatus.color }} />
                            {friend.photoURL ? (
                                <img src={friend.photoURL} alt={friend.displayName} className="w-20 h-20 rounded-full border-4 relative z-10 shadow-2xl object-cover" style={{ borderColor: fullStatus.color }} />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-3xl font-bold relative z-10 border-4" style={{ borderColor: fullStatus.color }}>
                                    {friend.displayName[0]}
                                </div>
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-white">@{friend.displayName}</h2>
                        <div className="mt-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse`} style={{ backgroundColor: fullStatus.color }} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{fullStatus.statusMessage}</span>
                        </div>
                    </div>

                    {/* The Bubble (Miniaturized Dash) */}
                    <div className="flex justify-center mb-8 relative">
                        {/* Glow behind the sphere */}
                        <div
                            className="absolute w-40 h-40 rounded-full blur-[60px] opacity-30 animate-pulse top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                            style={glowStyle}
                        />
                        <div
                            onClick={() => setShowChart(true)}
                            className="relative w-56 h-56 glass-sphere rounded-full overflow-hidden flex items-center justify-center transform transition-all hover:scale-105 cursor-pointer active:scale-95 group shadow-2xl"
                        >
                            <div className="absolute inset-0 bg-white/5 opacity- group-hover:opacity-100 transition-opacity z-30 pointer-events-none" />
                            <div className="absolute top-[10%] left-[10%] w-[40%] h-[25%] bg-gradient-to-b from-white/40 to-transparent rounded-[100%] rotate-[-45deg] blur-[2px] z-20 pointer-events-none" />

                            <div className="absolute bottom-0 left-0 right-0 z-0 transition-all duration-1000 ease-in-out w-full" style={{ height: `${liquidHeight}%`, maxHeight: '100%' }}>
                                <div className="absolute -top-3 left-0 w-[200%] h-6 bg-white/30 rounded-[100%] animate-[liquid-wave_6s_linear_infinite]" />
                                <div
                                    className="w-full h-full opacity-90 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]"
                                    style={gradientStyle}
                                ></div>
                            </div>

                            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] z-10 pointer-events-none border border-white/5"></div>

                            <div className="relative z-20 text-center flex flex-col items-center">
                                <div className="flex items-baseline justify-center">
                                    <span className="text-5xl font-black text-white tracking-tighter" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                                        {displayValue.toFixed(displayDecimals)}
                                    </span>
                                    <span className="text-lg font-bold text-white/50 ml-1">{displayUnit}</span>
                                </div>
                                <span className="text-[8px] font-black tracking-[0.2em] uppercase text-white/40 mt-1">{t.bacLevel}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="glass-panel-3d p-4 rounded-3xl flex flex-col items-center">
                            <Clock size={16} className="text-blue-400 mb-2" />
                            <div className="text-white font-bold">{soberTimeStr || '--:--'}</div>
                            <div className="text-[8px] text-white/30 uppercase tracking-widest mt-1 font-black">{t.soberAt}</div>
                        </div>
                        <div className="glass-panel-3d p-4 rounded-3xl flex flex-col items-center">
                            <Zap size={16} className="text-pink-400 mb-2" />
                            <div className="text-white font-bold">{Math.round(liquidHeight)}%</div>
                            <div className="text-[8px] text-white/30 uppercase tracking-widest mt-1 font-black">{t.limitLoad}</div>
                        </div>
                    </div>

                    {/* Recent Consumptions */}
                    <div className="mb-4">
                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <History size={12} /> {t.recentDrinks}
                        </h3>
                        {activeDrinks.length > 0 ? (
                            <div className="space-y-2">
                                {activeDrinks.slice(0, 5).map(drink => (
                                    <div key={drink.id} className="glass-panel-3d p-3 rounded-2xl flex items-center gap-3 bg-white/5 border-white/5">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg">
                                            {drink.icon || '🍺'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm text-white/90 truncate">{drink.name}</div>
                                            <div className="text-[10px] text-white/40 flex items-center gap-2">
                                                <span>{drink.volumeMl}ml</span>
                                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                                <span>{drink.abv}%</span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-mono text-white/30">
                                            {new Date(drink.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <span className="text-xs text-white/20 uppercase font-black tracking-widest">{t.noDrinks}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
