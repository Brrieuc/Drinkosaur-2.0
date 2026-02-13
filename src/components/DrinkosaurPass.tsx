
import React, { useState, useMemo, useRef } from 'react';
import { UserProfile, Drink, WonAward, PassStat, PassStatType, DrinkosaurPassConfig } from '../types';
import { X, Edit2, Save, Trophy, Flame, Beer, GlassWater, Hash, Clock, Star, TrendingUp, PaintBucket, LayoutGrid, Share2, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { AWARD_DEFINITIONS } from '../constants/awards';

interface DrinkosaurPassProps {
    user: UserProfile;
    wonAwards: WonAward[];
    drinks: Drink[];
    onSave: (updates: Partial<UserProfile>) => void;
    onClose: () => void;
    language: 'en' | 'fr';
}

const STAT_OPTIONS: { type: PassStatType; label: string; icon: any }[] = [
    { type: 'bestRanking', label: 'Meilleur Classement', icon: Trophy },
    { type: 'totalPureAlcohol', label: 'Alcool Pur Total', icon: GlassWater },
    { type: 'totalVolumeByAlcohol', label: 'Volume Total (Type)', icon: Beer },
    { type: 'longestStreak', label: 'Meilleure Streak', icon: Flame },
    { type: 'longestIntoxicated', label: 'Cuit le plus longtemps', icon: Clock },
    { type: 'favoriteDrink', label: 'Boisson Préférée', icon: Star },
    { type: 'totalChugs', label: 'Total Cul-Secs', icon: TrendingUp },
    { type: 'totalShots', label: 'Total Shots', icon: Hash },
];

const BG_COLORS = [
    '#1a1a1a', '#2e1065', '#451a03', '#064e3b', '#881337', '#1e3a8a', '#312e81', '#111827'
];

export const DrinkosaurPass: React.FC<DrinkosaurPassProps> = ({ user, wonAwards, drinks, onSave, onClose, language }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const passRef = useRef<HTMLDivElement>(null);

    // Local Config State
    const [config, setConfig] = useState<DrinkosaurPassConfig>(user.drinkosaurPassConfig || {
        backgroundColor: '#1a1a1a',
        selectedBadges: user.selectedBadges || [],
        stats: [
            { type: 'totalPureAlcohol' },
            { type: 'favoriteDrink' },
            { type: 'totalChugs' },
            { type: 'bestRanking' }
        ]
    });

    // --- STATS CALCULATIONS ---
    const statsData = useMemo(() => {
        // Helper: Sort drinks by time
        const sortedDrinks = [...drinks].sort((a, b) => a.timestamp - b.timestamp);

        // 1. Best Ranking
        const bestRanking = user.bestRanking || '-';

        // 2. Total Pure Alcohol (g)
        const totalPureAlcohol = sortedDrinks.reduce((acc, d) => acc + (d.volumeMl * d.abv * 0.8 / 100), 0).toFixed(0) + 'g';

        // 3. Volume by Type (Helper function)
        const getVolumeByType = (type: string) => {
            const vol = sortedDrinks.filter(d => d.type === type).reduce((acc, d) => acc + d.volumeMl, 0);
            return (vol / 1000).toFixed(1) + 'L';
        };

        // 4. Longest Streak (Days)
        let maxStreak = 0;
        let currentStreak = 0;
        let lastDateString = '';
        sortedDrinks.forEach(d => {
            const date = new Date(d.timestamp).toDateString();
            if (date !== lastDateString) {
                // Check if consecutive day
                const dayDiff = lastDateString ? (new Date(date).getTime() - new Date(lastDateString).getTime()) / (1000 * 3600 * 24) : 0;
                if (dayDiff === 1) {
                    currentStreak++;
                } else if (dayDiff > 1) {
                    currentStreak = 1;
                } else {
                    // Same day, ignore
                    if (currentStreak === 0) currentStreak = 1;
                }
                maxStreak = Math.max(maxStreak, currentStreak);
                lastDateString = date;
            }
        });

        // 5. Longest Intoxicated Duration (Auto-calculated session max)
        // Heuristic: A session ends if > 6 hours between drinks
        let maxSessionDuration = 0;
        let currentSessionStart = 0;
        let lastDrinkTime = 0;

        sortedDrinks.forEach(d => {
            if (d.timestamp - lastDrinkTime > 6 * 3600 * 1000) {
                // End session
                if (currentSessionStart > 0) {
                    maxSessionDuration = Math.max(maxSessionDuration, lastDrinkTime - currentSessionStart);
                }
                currentSessionStart = d.timestamp;
            }
            lastDrinkTime = d.timestamp;
        });
        // Check last session
        if (currentSessionStart > 0) {
            maxSessionDuration = Math.max(maxSessionDuration, lastDrinkTime - currentSessionStart);
        }
        const hoursIntoxicated = (maxSessionDuration / (1000 * 3600)).toFixed(1) + 'h';


        // 6. Favorite Drink
        const drinkCounts: Record<string, number> = {};
        sortedDrinks.forEach(d => {
            drinkCounts[d.name] = (drinkCounts[d.name] || 0) + 1;
        });
        const favoriteDrink = Object.entries(drinkCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

        // 7. Total Chugs
        const totalChugs = sortedDrinks.filter(d => d.isChug).length;

        // 8. Total Shots
        const totalShots = sortedDrinks.filter(d => d.type === 'spirit' || (d.volumeMl <= 60 && d.abv > 20)).length;

        return {
            bestRanking,
            totalPureAlcohol,
            getVolumeByType,
            maxStreak,
            hoursIntoxicated,
            favoriteDrink,
            totalChugs,
            totalShots
        };
    }, [drinks, user.bestRanking]);

    const renderStatValue = (stat: PassStat) => {
        switch (stat.type) {
            case 'bestRanking': return statsData.bestRanking;
            case 'totalPureAlcohol': return statsData.totalPureAlcohol;
            case 'totalVolumeByAlcohol': return statsData.getVolumeByType(stat.alcoholType || 'beer');
            case 'longestStreak': return statsData.maxStreak + (language === 'fr' ? ' j' : ' d');
            case 'longestIntoxicated': return statsData.hoursIntoxicated;
            case 'favoriteDrink': return statsData.favoriteDrink;
            case 'totalChugs': return statsData.totalChugs;
            case 'totalShots': return statsData.totalShots;
            default: return '-';
        }
    };

    const getStatLabel = (stat: PassStat) => {
        const base = STAT_OPTIONS.find(s => s.type === stat.type)?.label;
        if (stat.type === 'totalVolumeByAlcohol' && stat.alcoholType) {
            return `${base} (${stat.alcoholType})`;
        }
        return base || '';
    }

    const handleSaveConfig = () => {
        onSave({ drinkosaurPassConfig: config, selectedBadges: config.selectedBadges }); // Sync badges too
        setIsEditing(false);
    };

    const handleExport = async () => {
        if (!passRef.current) return;
        setIsExporting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 100)); // Render delay

            // 1. Generate PNG with iOS-safe settings
            const dataUrl = await toPng(passRef.current, {
                cacheBust: true,
                pixelRatio: 1.5, // Reduced from 3 to prevent iOS memory limit crashes
                backgroundColor: config.backgroundColor, // Ensure background is captured
                quality: 0.9,
                style: {
                    borderRadius: '0', // Prevent corner artifacts
                },
                skipFonts: true, // Fonts can sometimes block rendering on iOS
            });

            // 2. Prepare File for Sharing
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'drinkosaur-pass.png', { type: 'image/png' });

            // 3. Try Native Share (Mobile)
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Drinkosaur Pass',
                        text: 'Check my stats! 🦖'
                    });
                    return; // Success, stop here
                } catch (shareError) {
                    console.warn('Share cancelled or failed, falling back to download');
                }
            }

            // 4. Download Fallback (Desktop / Share failed)
            const link = document.createElement('a');
            link.download = `drinkosaur-pass-${user.username || 'user'}.png`;
            link.href = dataUrl;
            link.click();

        } catch (err) {
            console.error('Export failed:', err);
            alert(language === 'fr' ? 'Erreur lors de l\'export. Réessayez.' : 'Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    // Helper to avoid CORS cache issues
    const getSecureImgUrl = (url?: string) => {
        if (!url) return 'https://via.placeholder.com/150';
        if (url.startsWith('data:') || url.startsWith('blob:')) return url;
        // Append cache buster to force fresh request with CORS headers
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}t=${new Date().getDate()}`; // Salt by day to allow some caching but fix initial mismatch
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#050505] w-full max-w-md rounded-[32px] overflow-hidden flex flex-col max-h-[90vh] border border-white/10 shadow-2xl relative">

                {/* Header Controls */}
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    {!isEditing && (
                        <>
                            <button onClick={handleExport} disabled={isExporting} className="p-2 bg-emerald-500 hover:bg-emerald-400 rounded-full text-white transition-colors shadow-lg active:scale-95 disabled:opacity-50">
                                {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Share2 size={20} />}
                            </button>
                            <button onClick={() => setIsEditing(true)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                                <Edit2 size={20} />
                            </button>
                        </>
                    )}
                    {isEditing && (
                        <button onClick={handleSaveConfig} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors">
                            <Save size={20} />
                        </button>
                    )}
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-red-500/20 hover:text-red-400 rounded-full text-white/50 transition-colors">
                        <X size={20} />
                    </button>
                </div>


                {/* --- DISPLAY MODE --- */}
                <div ref={passRef} className="flex-1 overflow-y-auto no-scrollbar relative p-6 flex flex-col gap-6" style={{ background: config.backgroundColor }}>

                    {/* Title */}
                    <div className="text-center mt-4">
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow-lg" style={{ fontFamily: 'Impact, sans-serif' }}>
                            DRINKOSAUR PASS
                        </h2>
                    </div>

                    {/* Profile Photo */}
                    <div className="flex justify-center">
                        <div className="w-40 h-40 rounded-full border-8 border-white/10 shadow-2xl overflow-hidden relative bg-black/20">
                            <img
                                src={getSecureImgUrl(user.customPhotoURL || user.photoURL)}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                crossOrigin="anonymous"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>

                    {/* Username */}
                    <div className="text-center -mt-2">
                        <h3 className="text-2xl font-black text-white">{user.username ? `@${user.username}` : user.displayName}</h3>
                    </div>

                    {/* Badges Row */}
                    <div className="flex justify-center gap-3">
                        {[0, 1, 2].map(i => {
                            const badgeId = config.selectedBadges[i];
                            const badge = wonAwards.find(w => w.awardId === badgeId);
                            return (
                                <div key={i} className="w-24 h-24 bg-white/10 rounded-2xl border border-white/5 flex flex-col items-center justify-center p-2 relative">
                                    {isEditing && (
                                        <select
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            value={badgeId || ''}
                                            onChange={(e) => {
                                                const newBadges = [...config.selectedBadges];
                                                newBadges[i] = e.target.value;
                                                setConfig({ ...config, selectedBadges: newBadges });
                                            }}
                                        >
                                            <option value="">None</option>
                                            {wonAwards.map(w => (
                                                <option key={w.awardId} value={w.awardId}>{w.value} - {w.groupName}</option>
                                            ))}
                                        </select>
                                    )}
                                    {badge ? (
                                        <div className="w-full h-full p-2 flex flex-col items-center justify-center">
                                            <img
                                                src={getSecureImgUrl(AWARD_DEFINITIONS.find(a => a.id === badgeId)?.imageUrl)}
                                                className="w-12 h-12 object-contain drop-shadow-lg mb-1"
                                                alt="Award"
                                                crossOrigin="anonymous"
                                                referrerPolicy="no-referrer"
                                            />
                                            <span className="text-[10px] font-bold text-center leading-tight line-clamp-2 text-white/80">{badge.value}</span>
                                            <span className="text-[8px] text-white/40 mt-0.5 max-w-full truncate">{badge.groupName}</span>
                                        </div>
                                    ) : (
                                        <div className="text-white/20 text-xs font-bold uppercase">Empty</div>
                                    )}
                                    {isEditing && <div className="absolute top-1 right-1 pointer-events-none"><Edit2 size={10} className="text-white/50" /></div>}
                                </div>
                            );
                        })}
                    </div>

                    {/* Stats Section */}
                    <div className="space-y-4">
                        <h3 className="text-center text-xl font-black text-white/30 uppercase tracking-[0.2em]">DRINKOSTATS</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[0, 1, 2, 3].map(i => {
                                const stat = config.stats[i] || { type: 'totalPureAlcohol' };
                                const Icon = STAT_OPTIONS.find(s => s.type === stat.type)?.icon || LayoutGrid;

                                return (
                                    <div key={i} className="bg-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative min-h-[100px] border border-white/5">
                                        {isEditing && (
                                            <div className="absolute top-2 right-2 z-10">
                                                <select
                                                    className="w-4 h-4 opacity-0 absolute cursor-pointer"
                                                    value={stat.type}
                                                    onChange={(e) => {
                                                        const newStats = [...config.stats];
                                                        newStats[i] = { ...newStats[i], type: e.target.value as PassStatType };
                                                        if (e.target.value === 'totalVolumeByAlcohol' && !newStats[i].alcoholType) {
                                                            newStats[i].alcoholType = 'beer';
                                                        }
                                                        setConfig({ ...config, stats: newStats });
                                                    }}
                                                >
                                                    {STAT_OPTIONS.map(o => (
                                                        <option key={o.type} value={o.type}>{o.label}</option>
                                                    ))}
                                                </select>
                                                <Edit2 size={12} className="text-white/40 pointer-events-none" />
                                            </div>
                                        )}

                                        <Icon size={24} className="text-white/50 mb-2" />
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                                            {getStatLabel(stat)}
                                        </div>
                                        <div className="text-xl font-black text-white">
                                            {renderStatValue(stat)}
                                        </div>

                                        {isEditing && stat.type === 'totalVolumeByAlcohol' && (
                                            <div className="mt-1">
                                                <select
                                                    className="bg-black/40 text-[10px] text-white rounded px-1"
                                                    value={stat.alcoholType || 'beer'}
                                                    onChange={(e) => {
                                                        const newStats = [...config.stats];
                                                        newStats[i] = { ...newStats[i], alcoholType: e.target.value as any };
                                                        setConfig({ ...config, stats: newStats });
                                                    }}
                                                >
                                                    <option value="beer">Beer</option>
                                                    <option value="wine">Wine</option>
                                                    <option value="cocktail">Cocktail</option>
                                                    <option value="spirit">Spirit</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Background Color Picker (Edit Mode Only) */}
                    {isEditing && (
                        <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-2 mb-3">
                                <PaintBucket size={16} className="text-white/60" />
                                <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Theme Color</span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {BG_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setConfig({ ...config, backgroundColor: c })}
                                        className={`w-8 h-8 rounded-full border-2 ${config.backgroundColor === c ? 'border-white' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
