import React, { useMemo, useRef, useState } from 'react';
import { BacStatus, Drink, UserProfile } from '../types';
import { X, Share as ShareIcon, Loader2 } from 'lucide-react';
import { toBlob } from 'html-to-image';

interface ShareCardModalProps {
    status: BacStatus;
    user: UserProfile;
    drinks: Drink[];
    onClose: () => void;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({ status, user, drinks, onClose }) => {
    const isFrench = user.language === 'fr';
    const cardRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);

    const t = {
        title: isFrench ? 'Partager mon état' : 'Share my status',
        appName: 'Drinkosaur',
        currentDrinks: isFrench ? 'Boissons en cours' : 'Active Drinks',
        shareHint: isFrench ? 'Partager l\'image' : 'Share Image',
        bacLevel: isFrench ? 'Taux Alcool' : 'BAC Level',
        unitDesc: isFrench ? 'Grammes par Litre' : 'g/100ml',
        peak: isFrench ? 'Pic' : 'Peak',
        at: isFrench ? 'à' : '@',
    };

    // Logic for display value and unit (Duplicated from Dashboard for consistency)
    const displayValue = isFrench ? status.currentBac * 10 : status.currentBac;
    const displayUnit = isFrench ? 'g/L' : '%';
    const displayDecimals = isFrench ? 2 : 3;

    // Peak Logic
    const displayPeak = isFrench ? status.peakBac * 10 : status.peakBac;
    const showPeak = status.peakBac > status.currentBac + 0.005;
    const peakTimeStr = status.peakTime
        ? new Date(status.peakTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

    // Visual scaling
    const liquidHeight = Math.min((status.currentBac / 0.20) * 100, 100);

    // Dynamic gradient (Duplicated)
    const { gradientStyle, glowStyle } = useMemo(() => {
        const defaultGradient = 'linear-gradient(to top, #22d3ee, #3b82f6, #6366f1)';
        if (status.currentBac <= 0 || drinks.length === 0) {
            return {
                gradientStyle: { background: defaultGradient },
                glowStyle: { background: 'rgb(59, 130, 246)' }
            };
        }
        const now = Date.now();
        const activeDrinks = drinks
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
    }, [drinks, status.currentBac]);

    // Active drinks list for the card (last 3-5 to keep it clean?)
    const activeDrinksList = useMemo(() => {
        const now = Date.now();
        return drinks
            .filter(d => d.timestamp > now - 12 * 60 * 60 * 1000) // 12h window
            .sort((a, b) => b.timestamp - a.timestamp) // Newest first
            .slice(0, 4); // Take max 4
    }, [drinks]);

    const handleShare = async () => {
        if (!cardRef.current || isSharing) return;

        try {
            setIsSharing(true);

            // Create blob from the card
            const blob = await toBlob(cardRef.current, {
                cacheBust: true,
                style: {
                    borderRadius: '40px', // Ensure corners are captured correctly
                    transform: 'none' // Reset any transforms that might affect capture
                },
                filter: (node: any) => {
                    // Exclude the share button container from the capture
                    return !node.classList?.contains('share-export-ignore');
                }
            });

            if (!blob) {
                throw new Error('Failed to generate image');
            }

            const file = new File([blob], 'drinkosaur-status.png', { type: 'image/png' });

            // Use Web Share API if available
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Drinkosaur Status',
                    text: `Mon taux d'alcool actuel : ${displayValue.toFixed(displayDecimals)} ${displayUnit}`
                });
            } else {
                // Fallback: Download the image
                const link = document.createElement('a');
                link.download = 'drinkosaur-status.png';
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);
            }

            // Close modal after successful share/download attempt
            onClose();

        } catch (error) {
            console.error('Sharing failed:', error);
            alert('Could not share image. Please try again or take a screenshot manually.');
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="relative w-full max-w-sm">

                {/* Close Button */}
                {!isSharing && (
                    <button
                        onClick={onClose}
                        className="absolute -top-12 right-0 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                    >
                        <X size={24} />
                    </button>
                )}

                {/* The Card Component */}
                <div ref={cardRef} className="bg-[#0f0f13] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col items-center relative p-8">

                    {/* Background Decoration */}
                    <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-purple-500/10 to-transparent pointer-events-none" />

                    {/* 1. App Name */}
                    <h3 className="text-xl font-black text-white/40 tracking-[0.2em] uppercase mb-6 z-10">
                        {t.appName}
                    </h3>

                    {/* 2. 3D Sphere (Smaller version) */}
                    <div className="relative w-48 h-48 mb-6 z-10">
                        {/* Glow */}
                        <div
                            className="absolute inset-0 rounded-full blur-[40px] opacity-40 animate-pulse"
                            style={glowStyle}
                        />
                        <div className="relative w-full h-full glass-sphere rounded-full overflow-hidden flex items-center justify-center border border-white/10 bg-black/40 shadow-2xl">
                            {/* Specular Highlight */}
                            <div className="absolute top-[10%] left-[10%] w-[40%] h-[25%] bg-gradient-to-b from-white/40 to-transparent rounded-[100%] rotate-[-45deg] blur-[2px] z-20 pointer-events-none" />

                            {/* Liquid */}
                            <div className="absolute bottom-0 left-0 right-0 z-0 w-full" style={{ height: `${liquidHeight}%`, maxHeight: '100%' }}>
                                <div className="absolute -top-3 left-0 w-[200%] h-6 bg-white/30 rounded-[100%] animate-[liquid-wave_6s_linear_infinite]" />
                                <div className="w-full h-full opacity-90" style={gradientStyle}></div>
                            </div>

                            {/* Value Display */}
                            <div className="relative z-20 text-center flex flex-col items-center drop-shadow-2xl">
                                <div className="flex items-baseline justify-center">
                                    <span className="text-4xl font-black text-white tracking-tighter" style={{ textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                                        {displayValue.toFixed(displayDecimals)}
                                    </span>
                                    <span className="text-sm font-bold text-white/50 ml-1">{displayUnit}</span>
                                </div>
                                <span className="text-white/60 text-[8px] font-bold tracking-[0.2em] uppercase mt-1">
                                    {t.bacLevel}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3. User Pseudo */}
                    <div className="text-center mb-8 z-10">
                        <h2 className="text-3xl font-black text-white tracking-tight">@{user.username || 'joueur'}</h2>
                        {showPeak && (
                            <p className="text-xs text-red-300 font-mono mt-1 opacity-80">
                                {t.peak}: {displayPeak.toFixed(displayDecimals)} {t.at} {peakTimeStr}
                            </p>
                        )}
                    </div>

                    {/* 4. Active Drinks List */}
                    {activeDrinksList.length > 0 && (
                        <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/5 z-10">
                            <h4 className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-3 text-center">
                                {t.currentDrinks}
                            </h4>
                            <div className="flex flex-wrap justify-center gap-2">
                                {activeDrinksList.map((drink, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-black/40 rounded-full px-3 py-1.5 border border-white/5">
                                        <span className="text-lg">{drink.icon || '🍺'}</span>
                                        <span className="text-xs font-bold text-white/80">{drink.name}</span>
                                        <span className="text-[10px] text-white/40 font-mono scale-90">
                                            {new Date(drink.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                                {drinks.length > 4 && (
                                    <div className="px-2 py-1 flex items-center text-xs text-white/30 font-bold">
                                        + {drinks.length - 4} ...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer / Hint (Only shown when not capturing) */}
                    <div className="mt-8 pt-4 border-t border-white/5 w-full text-center z-10 share-export-ignore">
                        <button
                            onClick={handleShare}
                            disabled={isSharing}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isSharing ? (
                                <Loader2 size={16} className="text-white animate-spin" />
                            ) : (
                                <ShareIcon size={16} className="text-white" />
                            )}
                            <span className="text-xs text-white font-bold uppercase tracking-wide">
                                {t.shareHint}
                            </span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};
