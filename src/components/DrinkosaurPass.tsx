
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { UserProfile, Drink, WonAward, PassStat, PassStatType, DrinkosaurPassConfig } from '../types';
import { X, Edit2, Save, Trophy, Flame, Beer, GlassWater, Hash, Clock, Star, TrendingUp, PaintBucket, LayoutGrid, Share2, Loader2, Zap, Monitor, Lightbulb } from 'lucide-react';
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



const NeonEffect: React.FC = () => (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-visible">
        <div className="neon-ring" style={{ animation: 'neon-flicker-3d 4s infinite' }} />
        <div className="absolute inset-[-20%] bg-fuchsia-500/30 blur-2xl rounded-full animate-pulse" />
        {/* Inner Light Reflection */}
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_#d946ef] opacity-50 Mix-blend-overlay"></div>
    </div>
);


export const DrinkosaurPass: React.FC<DrinkosaurPassProps> = ({ user, wonAwards, drinks, onSave, onClose, language, isReadOnly }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
    const [activeBadgeSlot, setActiveBadgeSlot] = useState<number | null>(null); // Track which slot is being edited
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
                // 2. Fallback: Try fetching via CORS proxy (wsrv.nl)
                try {
                    const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
                    const response = await fetch(proxyUrl);
                    if (!response.ok) throw new Error('Proxy fetch failed');
                    const blob = await response.blob();
                    if (isMounted) setBlobUrl(URL.createObjectURL(blob));
                } catch (proxyError) {
                    console.warn('All profile image loading attempts failed, falling back to direct URL (Export might fail)', proxyError);
                    if (isMounted) setBlobUrl(url);
                }
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
                            {!isReadOnly && (
                                <button onClick={() => setIsEditing(true)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                                    <Edit2 size={20} />
                                </button>
                            )}
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
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow-lg scale-y-110" style={{ fontFamily: 'Impact, sans-serif' }}>
                            DRINKOPASS
                        </h2>
                    </div>

                    {/* Profile Photo */}
                    <div className="flex justify-center">
                        <div className="w-40 h-40 rounded-full border-8 border-white/10 shadow-2xl overflow-visible relative bg-black/20 group">
                            {config.profileEffect === 'fire' && <FireEffect />}
                            {config.profileEffect === 'electric' && <ElectricEffect />}
                            {/* For Glitch, we render the mask separately, but the effect component handles the layers */}
                            {config.profileEffect === 'glitch' && <GlitchEffect />}

                            {config.profileEffect === 'neon' && <NeonEffect />}

                            <div className={`w-full h-full rounded-full overflow-hidden relative z-20 ${config.profileEffect === 'glitch' ? 'glitch-container' : ''}`}>
                                <img
                                    src={blobUrl || getSecureImgUrl(user.customPhotoURL || user.photoURL)}
                                    alt="Profile"
                                    className={`w-full h-full object-cover ${config.profileEffect === 'glitch' ? 'brightness-125 contrast-125 grayscale-[0.3]' : ''}`}
                                    // Only add CORS attributes if we successfully loaded a blob.
                                    // If falling back to remote URL, avoid crossOrigin to prevent broken image icon (display priority).
                                    {...((blobUrl?.startsWith('blob:') || blobUrl?.startsWith('data:')) ? { crossOrigin: "anonymous" } : {})}
                                    referrerPolicy="no-referrer"
                                />
                            </div>
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
                                        className={`w-24 h-24 rounded-3xl border border-white/10 flex items-center justify-center p-0 relative transition-transform active:scale-95 ${badge ? 'bg-white/5 cursor-pointer hover:bg-white/10' : 'bg-white/5'}`}
                                        onClick={() => {
                                            if (isEditing) {
                                                setActiveBadgeSlot(i);
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
                            </div>
                        </div>
                    )}
                </div>

                {/* Detail Overlay (When Badge Clicked) */}
                {selectedDetailId && (
                    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-200" onClick={() => setSelectedDetailId(null)}>
                        <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white/70 hover:bg-white/20">
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
                    </div>
                )}

                {/* Badge Selector Modal (Grid View) */}
                {activeBadgeSlot !== null && (
                    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Select Badge</h3>
                            <button
                                onClick={() => setActiveBadgeSlot(null)}
                                className="p-2 bg-white/10 rounded-full text-white/70 hover:bg-white/20"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-4 gap-4 pb-20">
                            {/* Empty Option */}
                            <div
                                className="aspect-square rounded-2xl border-2 border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={() => {
                                    const newBadges = [...config.selectedBadges];
                                    newBadges[activeBadgeSlot] = '';
                                    setConfig({ ...config, selectedBadges: newBadges });
                                    setActiveBadgeSlot(null);
                                }}
                            >
                                <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                                    <X size={16} className="text-white/30" />
                                </div>
                                <span className="text-[10px] font-bold text-white/40 uppercase">None</span>
                            </div>

                            {/* Won Awards */}
                            {wonAwards.map((award) => {
                                const def = AWARD_DEFINITIONS.find(a => a.id === award.awardId);
                                const isSelected = config.selectedBadges.includes(award.awardId);
                                const isActive = config.selectedBadges[activeBadgeSlot] === award.awardId;

                                // Group Name or Display Name
                                // User asked for "Nom du dinosaure (Beerosaur...)" which is typically the groupName
                                const dinoName = award.groupName;

                                return (
                                    <div
                                        key={award.awardId}
                                        className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-2 cursor-pointer transition-all ${isActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 hover:bg-white/5'} ${isSelected && !isActive ? 'opacity-50 grayscale' : ''}`}
                                        onClick={() => {
                                            const newBadges = [...config.selectedBadges];
                                            newBadges[activeBadgeSlot] = award.awardId;
                                            setConfig({ ...config, selectedBadges: newBadges });
                                            setActiveBadgeSlot(null);
                                        }}
                                    >
                                        <div className="flex-1 w-full flex items-center justify-center relative">
                                            <img
                                                src={AWARD_IMAGES[award.awardId] || getSecureImgUrl(def?.imageUrl)}
                                                className="w-full h-full object-contain drop-shadow-lg"
                                                alt={dinoName}
                                            />
                                            {isActive && (
                                                <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                                    <X size={10} className="text-white transform rotate-45" style={{ transform: 'none' /* Override X rotate */ }}><span className="text-[10px]">✓</span></X>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-bold text-white/60 uppercase tracking-wide text-center mt-1 truncate w-full">
                                            {dinoName}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
