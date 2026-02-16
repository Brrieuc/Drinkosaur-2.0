import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserProfile, Drink, WonAward, PassStat, PassStatType, DrinkosaurPassConfig } from '../types';
import { X, Edit2, Save, Trophy, Flame, Beer, GlassWater, Hash, Clock, Star, TrendingUp, PaintBucket, LayoutGrid, Share2, Loader2, Zap, Monitor, Lightbulb, Sparkles, Lock } from 'lucide-react';
import { toPng } from 'html-to-image';
import { AWARD_DEFINITIONS } from '../constants/awards';
import { AWARD_IMAGES } from '../constants/awardsImages';

interface DrinkosaurPassProps {
    user: UserProfile;
    wonAwards: WonAward[];
    drinks: Drink[];
    onSave: (updates: Partial<UserProfile>) => void;
    onClose: () => void;
    language: 'en' | 'fr';
    isReadOnly?: boolean;
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

const FireEffect: React.FC = () => (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-visible">
        {/* Heat Haze / Glow */}
        <div className="absolute inset-[-15%] bg-gradient-to-t from-orange-500/20 to-transparent blur-xl rounded-full animate-pulse"></div>
        <div className="absolute inset-0 fire-core opacity-80 mix-blend-screen" />

        {/* 3D Rising Particles */}
        <div className="absolute inset-0 overflow-visible">
            {[...Array(15)].map((_, i) => (
                <div
                    key={`fire-3d-${i}`}
                    className="fire-particle-3d"
                    style={{
                        left: `${Math.random() * 80 + 10}%`,
                        bottom: '-10%',
                        width: `${Math.random() * 20 + 20}px`,
                        height: `${Math.random() * 20 + 20}px`,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${1.5 + Math.random()}s`
                    }}
                />
            ))}
        </div>

        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <filter id="fire-filter">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="fire" />
                <feComposite in="SourceGraphic" in2="fire" operator="atop" />
            </filter>
        </svg>
    </div>
);

const ElectricEffect: React.FC = () => (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-visible">
        {/* Intense Bloom */}
        <div className="absolute inset-[-5%] rounded-full shadow-[0_0_30px_#3b82f6] opacity-60 animate-pulse"></div>
        <div className="absolute inset-[-2%] rounded-full border-2 border-white/50 blur-[1px] animate-ping" />

        {/* Plasma Core */}
        <div className="electric-arc" />
        <div className="electric-arc" style={{ animationDirection: 'reverse', animationDuration: '3s', borderColor: '#a855f7' }} />

        {/* Lightning flashes */}
        <div className="electric-bolt border-l-2 border-cyan-300 transform rotate-45" style={{ animationDelay: '0.2s', filter: 'drop-shadow(0 0 5px cyan)' }} />
        <div className="electric-bolt border-r-2 border-white transform -rotate-12" style={{ animationDelay: '1.5s', filter: 'drop-shadow(0 0 8px white)' }} />
        <div className="electric-bolt border-t-2 border-purple-400 transform rotate-90" style={{ animationDelay: '2.3s', filter: 'drop-shadow(0 0 5px purple)' }} />
    </div>
);

const GlitchEffect: React.FC = () => (
    <div className="absolute inset-0 z-50 pointer-events-none rounded-full glitch-container">
        <div className="glitch-layer bg-red-500/30" style={{ transform: 'translate(-2px, 0)', animation: 'glitch-rgb-shift 2.5s infinite steps(2, start) reverse' }}></div>
        <div className="glitch-layer bg-blue-500/30" style={{ transform: 'translate(2px, 0)', animation: 'glitch-rgb-shift 2s infinite steps(2, start)' }}></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-green-500/20 to-purple-500/20 mix-blend-overlay animate-pulse"></div>
        <div className="absolute inset-0 border-2 border-green-400/50 rounded-full shadow-[0_0_15px_rgba(74,222,128,0.4)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
    </div>
);



export const NeonEffect: React.FC = () => (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-visible">
        <div className="neon-ring" style={{ animation: 'neon-flicker-3d 4s infinite' }} />
        <div className="absolute inset-[-20%] bg-fuchsia-500/30 blur-2xl rounded-full animate-pulse" />
        {/* Inner Light Reflection */}
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_#d946ef] opacity-50 mix-blend-overlay"></div>
    </div>
);

export const DivineEffect: React.FC = () => (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-visible">
        {/* Amber Glass Glow */}
        <div className="absolute inset-0 rounded-full border-4 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.4),inset_0_0_30px_rgba(245,158,11,0.2)]"></div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-amber-500/10 to-transparent mix-blend-overlay"></div>

        {/* Fast Rising Tiny Bubbles (Carbonation) */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
            {[...Array(20)].map((_, i) => (
                <div
                    key={`carb-${i}`}
                    className="divine-bubble"
                    style={{
                        left: `${Math.random() * 100}%`,
                        bottom: '-10%',
                        width: `${Math.random() * 3 + 1}px`,
                        height: `${Math.random() * 3 + 1}px`,
                        animationDuration: `${0.8 + Math.random() * 1.5}s`,
                        animationDelay: `${Math.random() * 2}s`
                    }}
                />
            ))}
        </div>

        {/* Subtle Foam Head (Creamy Top) */}
        <div className="absolute top-[-5%] left-[10%] right-[10%] h-[15%] rounded-[100%] bg-gradient-to-b from-white via-[#fffbeb] to-transparent blur-[4px] opacity-80"></div>
    </div>
);

export const ProfileEffect: React.FC<{ effect?: string }> = ({ effect }) => {
    switch (effect) {
        case 'fire': return <FireEffect />;
        case 'electric': return <ElectricEffect />;
        case 'glitch': return <GlitchEffect />;
        case 'neon': return <NeonEffect />;
        case 'divine': return <DivineEffect />;
        default: return null;
    }
};

export const ProfilePhoto: React.FC<{
    photoURL?: string;
    effect?: string;
    size?: string;
    borderColor?: string;
    className?: string;
    containerClassName?: string;
    rounded?: string;
    crossOrigin?: "anonymous" | "use-credentials" | "";
    referrerPolicy?: React.HTMLAttributeReferrerPolicy;
}> = ({ photoURL, effect, size = 'w-12 h-12', borderColor = 'white', className = '', containerClassName = '', rounded = 'rounded-full', crossOrigin, referrerPolicy }) => {
    return (
        <div className={`relative ${size} ${containerClassName}`}>
            {effect && <ProfileEffect effect={effect} />}
            <div className={`w-full h-full ${rounded} overflow-hidden relative z-20 ${effect === 'glitch' ? 'glitch-container' : ''} ${className}`}>
                <img
                    src={photoURL || 'https://via.placeholder.com/150'}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy={referrerPolicy}
                    crossOrigin={crossOrigin}
                />
                {/* Glossy Overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none opacity-40 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-transparent to-black/20 pointer-events-none" />
            </div>
            {/* Visual Border / Ring */}
            <div className={`absolute inset-0 border-2 ${rounded} z-30 pointer-events-none opacity-40 shadow-inner`} style={{ borderColor: borderColor }} />
            {/* Ambient Shadow for depth */}
            <div className={`absolute -inset-1 ${rounded} bg-black/20 blur-sm -z-10 pointer-events-none`} />
        </div>
    );
};

export const DrinkosaurPass: React.FC<DrinkosaurPassProps> = ({ user, wonAwards, drinks, onSave, onClose, language, isReadOnly }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
    const [isBadgeSelectorOpen, setIsBadgeSelectorOpen] = useState(false);
    const [activeBadgeSlot, setActiveBadgeSlot] = useState<number | null>(null);
    const passRef = useRef<HTMLDivElement>(null);

    // Preload profile image as Blob to bypass CORS during export
    useEffect(() => {
        const url = user.customPhotoURL || user.photoURL;
        if (!url) return;

        // If it's already a blob or data URL, use it
        if (url.startsWith('blob:') || url.startsWith('data:')) {
            setBlobUrl(url);
            return;
        }

        let isMounted = true;
        (async () => {
            try {
                // 1. Try direct fetch with CORS
                const response = await fetch(url, { mode: 'cors' });
                if (!response.ok) throw new Error('Direct fetch failed');
                const blob = await response.blob();
                if (isMounted) setBlobUrl(URL.createObjectURL(blob));
            } catch (e) {
                console.warn('Cross-origin photo fetch failed, export quality might be lower', e);
                // Fallback will use the direct URL in getSecureImgUrl
            }
        })();

        return () => { isMounted = false; };
    }, [user.customPhotoURL, user.photoURL]);

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

    // Helper to avoid CORS cache issues (only for non-blob URLs)
    const getSecureImgUrl = (url?: string, highRes: boolean = false) => {
        if (!url) return 'https://via.placeholder.com/150';
        if (url.startsWith('data:') || url.startsWith('blob:')) return url;

        let processedUrl = url;
        // Improve quality for Blogger URLs if highRes requested
        if (highRes && url.includes('blogger.googleusercontent.com')) {
            return url.replace(/\/s[0-9]+\//, '/s1000/');
        }

        // Append cache buster to force fresh request with CORS headers for non-resizing calls
        const separator = processedUrl.includes('?') ? '&' : '?';
        return `${processedUrl}${separator}t=${new Date().getDate()}`; // Salt by day to allow some caching but fix initial mismatch
    };

    // Body scroll lock
    useEffect(() => {
        if (document.body && document.body.classList) {
            document.body.classList.add('modal-open');
        }
        return () => {
            const hasOtherModals = document.querySelectorAll('.modal-overlay').length > 1;
            if (!hasOtherModals) {
                document.body.classList.remove('modal-open');
            }
        };
    }, []);

    return createPortal(
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-3xl animate-fade-in pointer-events-auto">
            <div className="w-full max-w-md bg-[#0a0a0a] rounded-[40px] border border-white/10 shadow-2xl relative animate-scale-up max-h-[90vh] flex flex-col modal-container pointer-events-auto overflow-hidden">

                {/* Header Controls */}
                <div className="absolute top-6 right-6 z-[60] flex gap-2">
                    {!isEditing && (
                        <>
                            <button onClick={handleExport} disabled={isExporting} className="p-2 bg-emerald-500 hover:bg-emerald-400 rounded-full text-white transition-colors shadow-lg active:scale-95 disabled:opacity-50">
                                {isExporting ? <Loader2 size={24} className="animate-spin" /> : <Share2 size={24} />}
                            </button>
                            {!isReadOnly && (
                                <button onClick={() => setIsEditing(true)} className="p-2 bg-white/5 rounded-full text-white/40 hover:bg-white/10 transition-colors shadow-lg">
                                    <Edit2 size={24} />
                                </button>
                            )}
                        </>
                    )}
                    {isEditing && (
                        <button onClick={handleSaveConfig} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors shadow-lg">
                            <Save size={24} />
                        </button>
                    )}
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-colors shadow-lg">
                        <X size={24} />
                    </button>
                </div>


                {/* --- DISPLAY MODE --- */}
                <div ref={passRef} className="flex-1 overflow-y-auto no-scrollbar relative p-6 flex flex-col gap-6" style={{ background: config.backgroundColor }}>

                    {/* Title */}
                    <div className="text-center mt-4">
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow-lg scale-y-110" style={{ fontFamily: 'Impact, sans-serif' }}>
                            DRINKOPASS
                        </h2>
                    </div>

                    {/* Profile Photo */}
                    <div className="flex justify-center">
                        <div className="relative group">
                            {isEditing && (
                                <div className="absolute -top-1 -right-1 z-30 bg-blue-600 p-1.5 rounded-full shadow-lg border-2 border-[#1a1a2e] animate-bounce">
                                    <Sparkles size={10} className="text-white" />
                                </div>
                            )}

                            <ProfilePhoto
                                photoURL={blobUrl || user.customPhotoURL || user.photoURL || undefined}
                                effect={config.profileEffect}
                                size="w-32 h-32"
                                borderColor={config.backgroundColor || 'rgba(139, 92, 246, 0.5)'}
                                className="shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                                rounded="rounded-[32px]"
                                crossOrigin={blobUrl ? "anonymous" : undefined}
                                referrerPolicy={blobUrl ? "no-referrer" : undefined}
                            />
                        </div>
                    </div>

                    {/* Username */}
                    <div className="text-center -mt-2">
                        <h3 className="text-2xl font-black text-white">{user.username ? `@${user.username}` : user.displayName}</h3>
                    </div>

                    {/* Badges Row */}
                    <div className="flex justify-center gap-2">
                        {[0, 1, 2].map(i => {
                            const badgeId = config.selectedBadges[i];
                            const badge = wonAwards.find(w => w.awardId === badgeId);
                            const def = AWARD_DEFINITIONS.find(a => a.id === badgeId);
                            const displayName = language === 'fr' ? def?.name_fr : def?.name;

                            return (
                                <div key={i} className="flex flex-col items-center gap-1 w-28">
                                    <div
                                        className={`w-24 h-24 rounded-3xl border border-white/10 flex items-center justify-center p-0 relative transition-transform active:scale-95 ${badge ? 'bg-white/5 cursor-pointer hover:bg-white/10' : 'bg-white/5'} ${isEditing ? 'ring-2 ring-blue-500/20 hover:ring-blue-500/50' : ''}`}
                                        onClick={() => {
                                            if (isEditing) {
                                                setActiveBadgeSlot(i);
                                                setIsBadgeSelectorOpen(true);
                                            } else if (badge) {
                                                setSelectedDetailId(badgeId);
                                            }
                                        }}
                                    >
                                        {badge ? (
                                            <img
                                                src={AWARD_IMAGES[badgeId] || getSecureImgUrl(def?.imageUrl)}
                                                className="w-full h-full object-contain drop-shadow-2xl"
                                                alt="Award"
                                                {...(!AWARD_IMAGES[badgeId] ? { crossOrigin: "anonymous", referrerPolicy: "no-referrer" } : {})}
                                            />
                                        ) : (
                                            <div className="text-white/10 text-xs font-bold uppercase">Empty</div>
                                        )}
                                        {isEditing && <div className="absolute top-1 right-1 pointer-events-none z-0"><Edit2 size={12} className="text-white/50" /></div>}
                                    </div>
                                    {/* Name Label Below */}
                                    {badge && (
                                        <div className="text-center px-1">
                                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wide leading-tight block">
                                                {displayName || badge.groupName}
                                            </span>
                                        </div>
                                    )}
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

                    {/* Profile Effects (Edit Mode Only) */}
                    {isEditing && (
                        <div className="mt-4 p-4 bg-black/40 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-2 mb-3">
                                <Flame size={16} className="text-orange-400" />
                                <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Effets Photo</span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => setConfig({ ...config, profileEffect: 'none' })}
                                    className={`px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${!config.profileEffect || config.profileEffect === 'none' ? 'bg-white/20 border-white text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                                >
                                    Aucun
                                </button>
                                <button
                                    onClick={() => setConfig({ ...config, profileEffect: 'fire' })}
                                    className={`px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${config.profileEffect === 'fire' ? 'bg-orange-600/20 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(234,88,12,0.3)]' : 'bg-white/5 border-white/10 text-white/40'}`}
                                >
                                    <Flame size={12} /> Feu
                                </button>
                                <button
                                    onClick={() => setConfig({ ...config, profileEffect: 'electric' })}
                                    className={`px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${config.profileEffect === 'electric' ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/10 text-white/40'}`}
                                >
                                    <Zap size={12} /> Électrique
                                </button>
                                <button
                                    onClick={() => setConfig({ ...config, profileEffect: 'glitch' })}
                                    className={`px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${config.profileEffect === 'glitch' ? 'bg-green-600/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-white/5 border-white/10 text-white/40'}`}
                                >
                                    <Monitor size={12} /> Glitch
                                </button>
                                <button
                                    onClick={() => setConfig({ ...config, profileEffect: 'neon' })}
                                    className={`px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${config.profileEffect === 'neon' ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.3)]' : 'bg-white/5 border-white/10 text-white/40'}`}
                                >
                                    <Lightbulb size={12} /> Néon
                                </button>
                                <button
                                    onClick={() => setConfig({ ...config, profileEffect: 'divine' })}
                                    className={`px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${config.profileEffect === 'divine' ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-white/5 border-white/10 text-white/40'}`}
                                >
                                    <Sparkles size={12} /> Divin
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Detail Overlay (When Badge Clicked) */}
                {selectedDetailId && createPortal(
                    <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-fade-in" onClick={() => setSelectedDetailId(null)}>
                        <button className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-white/40 hover:bg-white/10 transition-colors shadow-lg">
                            <X size={24} />
                        </button>

                        {(() => {
                            const def = AWARD_DEFINITIONS.find(a => a.id === selectedDetailId);
                            const won = wonAwards.find(w => w.awardId === selectedDetailId);
                            const displayName = language === 'fr' ? def?.name_fr : def?.name;
                            const displayDesc = language === 'fr' ? def?.description_fr : def?.description;

                            return (
                                <div className="flex flex-col items-center text-center gap-6" onClick={e => e.stopPropagation()}>
                                    <div className="w-48 h-48 relative">
                                        <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full animate-pulse"></div>
                                        <img
                                            src={getSecureImgUrl(def?.imageUrl, true)}
                                            className="w-full h-full object-contain drop-shadow-2xl relative z-10 hover:scale-105 transition-transform duration-500"
                                            alt={displayName}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-3xl font-black text-white uppercase tracking-tight">{displayName}</h3>
                                        <div className="px-4 py-1 bg-white/10 rounded-full inline-block">
                                            <span className="text-emerald-400 font-bold font-mono">{won?.value}</span>
                                        </div>
                                    </div>

                                    <p className="text-white/60 text-sm max-w-[280px] leading-relaxed">
                                        {displayDesc}
                                    </p>
                                </div>
                            );
                        })()}
                    </div>,
                    document.body
                )}

                {/* Badge Selection Modal (4x4 Grid) */}
                {isBadgeSelectorOpen && activeBadgeSlot !== null && createPortal(
                    <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-3xl flex items-center justify-center p-4 animate-fade-in pointer-events-auto">
                        <div className="w-full max-w-md bg-[#0a0a0a] rounded-[40px] border border-white/10 shadow-2xl relative animate-scale-up max-h-[80vh] flex flex-col modal-container pointer-events-auto overflow-hidden">
                            <div className="p-6 flex items-center justify-between border-b border-white/10 bg-white/[0.02]">
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">
                                        {language === 'fr' ? 'Choisir un Badge' : 'Choose a Badge'}
                                    </h3>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                                        {language === 'fr' ? `Emplacement ${activeBadgeSlot + 1}` : `Slot ${activeBadgeSlot + 1}`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsBadgeSelectorOpen(false)}
                                    className="p-2 bg-white/5 rounded-full text-white/40 hover:bg-white/10 transition-colors shadow-lg"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                                <div className="grid grid-cols-4 gap-3">
                                    {/* Clear Slot Option */}
                                    <button
                                        onClick={() => {
                                            const newBadges = [...config.selectedBadges];
                                            newBadges[activeBadgeSlot] = '';
                                            setConfig({ ...config, selectedBadges: newBadges });
                                            setIsBadgeSelectorOpen(false);
                                        }}
                                        className="aspect-square rounded-2xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center flex-col gap-1 hover:bg-white/10 transition-all group"
                                    >
                                        <X size={16} className="text-white/20 group-hover:text-white/40" />
                                        <span className="text-[8px] font-black text-white/20 uppercase">Effacer</span>
                                    </button>

                                    {wonAwards.map((won) => {
                                        const def = AWARD_DEFINITIONS.find(a => a.id === won.awardId);
                                        const isSelected = config.selectedBadges.includes(won.awardId);

                                        return (
                                            <button
                                                key={`${won.awardId}-${won.groupId}`}
                                                onClick={() => {
                                                    const newBadges = [...config.selectedBadges];
                                                    newBadges[activeBadgeSlot] = won.awardId;
                                                    setConfig({ ...config, selectedBadges: newBadges });
                                                    setIsBadgeSelectorOpen(false);
                                                }}
                                                className={`aspect-square rounded-2xl flex items-center justify-center p-2 relative transition-all group overflow-hidden border ${isSelected ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                            >
                                                <img
                                                    src={AWARD_IMAGES[won.awardId] || getSecureImgUrl(def?.imageUrl)}
                                                    className="w-full h-full object-contain drop-shadow-lg relative z-10"
                                                    alt={won.awardId}
                                                />
                                                {isSelected && (
                                                    <div className="absolute inset-0 bg-blue-600/10 z-0" />
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 z-20">
                                                    <span className="text-[8px] font-black text-white text-center leading-tight p-1 px-2 mb-[-60%]">
                                                        {won.value}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}

                                    {/* Placeholders for 4x4 if needed or just padding */}
                                    {[...Array(Math.max(0, 15 - wonAwards.length))].map((_, i) => (
                                        <div key={i} className="aspect-square rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                                            <Lock size={12} className="text-white/5" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-white/5 border-t border-white/10 text-center">
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                                    {language === 'fr' ? 'Badge gagné dans vos groupes' : 'Badges won in your groups'}
                                </p>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </div>,
        document.body
    );
};
