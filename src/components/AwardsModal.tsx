import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Trophy, Loader2 } from 'lucide-react';
import { AWARD_DEFINITIONS, ComputedAward } from '../constants/awards';
import { WonAward } from '../types';

const MONTH_NAMES_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface AwardsModalProps {
    groupId: string;
    groupName: string;
    awards: ComputedAward[];
    loading: boolean;
    selectedMonth: { month: number; year: number };
    onFetchAwards: (groupId: string, month: number, year: number) => void;
    onClose: () => void;
    language: 'en' | 'fr';
    myUid: string;
    wonAwards?: WonAward[];
    onClaimAward: (award: ComputedAward) => Promise<boolean>;
    appLaunch: { month: number; year: number };
}

export const AwardsModal: React.FC<AwardsModalProps> = ({
    groupId,
    groupName,
    awards,
    loading,
    selectedMonth,
    onFetchAwards,
    onClose,
    language,
    myUid,
    wonAwards = [],
    onClaimAward,
    appLaunch
}) => {
    const [revealedIndex, setRevealedIndex] = useState(-1);
    const [isRevealing, setIsRevealing] = useState(false);
    const [selectedAward, setSelectedAward] = useState<ComputedAward | null>(null);
    const [isClaiming, setIsClaiming] = useState(false);

    const monthNames = language === 'fr' ? MONTH_NAMES_FR : MONTH_NAMES_EN;

    // Fetch awards on mount
    useEffect(() => {
        onFetchAwards(groupId, selectedMonth.month, selectedMonth.year);
    }, []);

    const navigateMonth = (direction: -1 | 1) => {
        let newMonth = selectedMonth.month + direction;
        let newYear = selectedMonth.year;
        if (newMonth < 0) { newMonth = 11; newYear--; }
        if (newMonth > 11) { newMonth = 0; newYear++; }

        // Don't go before app launch
        if (newYear < appLaunch.year || (newYear === appLaunch.year && newMonth < appLaunch.month)) return;

        const now = new Date();
        // Don't go into the future
        if (newYear > now.getFullYear() || (newYear === now.getFullYear() && newMonth > now.getMonth())) return;


        setRevealedIndex(-1);
        setIsRevealing(false);
        setSelectedAward(null);
        onFetchAwards(groupId, newMonth, newYear);
    };

    const handleRevealAll = () => {
        if (isRevealing || awards.length === 0) return;
        setIsRevealing(true);
        setRevealedIndex(-1);
        let i = 0;
        const interval = setInterval(() => {
            setRevealedIndex(i);
            i++;
            if (i >= awards.length) {
                clearInterval(interval);
                setIsRevealing(false);
            }
        }, 300);
    };

    const getAwardDef = (awardId: string) => AWARD_DEFINITIONS.find(a => a.id === awardId);

    const isAwardClaimed = (award: ComputedAward) => wonAwards.some(w =>
        w.awardId === award.awardId && w.groupId === groupId && w.month === award.month && w.year === award.year
    );

    const handleClaim = async (e: React.MouseEvent, award: ComputedAward) => {
        e.stopPropagation();
        if (isClaiming || isAwardClaimed(award)) return;
        setIsClaiming(true);
        await onClaimAward(award);
        setIsClaiming(false);
    };

    // Body scroll lock
    useEffect(() => {
        document.body.classList.add('modal-open');
        return () => {
            // Check if there are other modals open before removing the class
            const modalCheck = document.querySelectorAll('.fixed.z-\\[200\\]').length;
            if (modalCheck <= 1) {
                document.body.classList.remove('modal-open');
            }
        };
    }, []);

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-stretch justify-stretch bg-black/80 backdrop-blur-xl animate-fade-in pointer-events-auto">
            <div className="flex flex-col w-full h-full bg-[#050505] text-white font-sans pointer-events-auto overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] bg-white/5 border-b border-white/5 shrink-0">
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/40 hover:bg-white/10 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                    <div className="text-center">
                        <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2 justify-center italic">
                            <Trophy size={20} className="text-amber-400" />
                            {language === 'fr' ? 'Awards du Groupe' : 'Group Awards'}
                        </h2>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">{groupName}</p>
                    </div>
                    <div className="w-10" />
                </div>

                {/* Month Selector */}
                <div className="flex items-center justify-center gap-6 py-6 px-6 shrink-0 bg-white/[0.02]">
                    <button onClick={() => navigateMonth(-1)} className="p-3 bg-white/5 rounded-2xl text-white/40 hover:bg-white/10 hover:text-white transition-all shadow-lg active:scale-95">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center min-w-[160px]">
                        <h3 className="text-lg font-black text-white">{monthNames[selectedMonth.month]}</h3>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">{selectedMonth.year}</p>
                    </div>
                    <button onClick={() => navigateMonth(1)} className="p-3 bg-white/5 rounded-2xl text-white/40 hover:bg-white/10 hover:text-white transition-all shadow-lg active:scale-95">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-40 no-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-6">
                            <div className="relative">
                                <Loader2 className="animate-spin text-amber-400" size={56} strokeWidth={3} />
                                <Trophy className="absolute inset-0 m-auto text-amber-400/20" size={24} />
                            </div>
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] animate-pulse">
                                {language === 'fr' ? 'Calcul des awards...' : 'Computing awards...'}
                            </p>
                        </div>
                    ) : awards.length === 0 ? (
                        <div className="py-32 flex flex-col items-center gap-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                <Trophy size={32} className="text-white/10" />
                            </div>
                            <p className="text-white/30 uppercase font-black tracking-widest text-xs">
                                {language === 'fr' ? 'Aucun award pour ce mois' : 'No awards for this month'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {revealedIndex < 0 && !isRevealing && (
                                <button onClick={handleRevealAll} className="w-full mb-8 py-5 bg-gradient-to-br from-amber-400 via-amber-600 to-amber-700 rounded-[24px] font-black uppercase text-white shadow-[0_10px_30px_rgba(245,158,11,0.3)] active:scale-[0.98] transition-all tracking-widest text-sm">
                                    {language === 'fr' ? 'Révéler les Awards' : 'Reveal Awards'}
                                </button>
                            )}
                            <div className="grid grid-cols-2 gap-4 pb-10">
                                {awards.map((award, index) => {
                                    const def = getAwardDef(award.awardId);
                                    if (!def) return null;
                                    const isRevealed = index <= revealedIndex;
                                    return (
                                        <div
                                            key={award.awardId}
                                            onClick={() => isRevealed && setSelectedAward(award)}
                                            className={`glass-panel-3d p-4 rounded-[32px] flex flex-col items-center gap-4 transition-all duration-700 border-white/5 ${isRevealed ? 'opacity-100 scale-100' : 'opacity-20 blur-md pointer-events-none scale-95 translate-y-4'}`}
                                        >
                                            <div className="w-20 h-20 relative">
                                                {isRevealed ? (
                                                    <img src={def.imageUrl} className="w-full h-full object-contain animate-float-slow drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-full text-3xl opacity-20">?</div>
                                                )}
                                            </div>
                                            <div className="text-center">
                                                <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-wider mb-2">{isRevealed ? (language === 'fr' ? def.name_fr : def.name) : '???'}</h4>
                                                {isRevealed && (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <img src={award.recipientPhoto || 'https://via.placeholder.com/150'} className="w-8 h-8 rounded-full border-2 border-amber-500/30 object-cover" />
                                                        <span className="text-[10px] font-black text-white/60">@{award.recipientName}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Detail Modal */}
                {selectedAward && (() => {
                    const def = getAwardDef(selectedAward.awardId);
                    if (!def) return null;
                    const isMyAward = selectedAward.recipientUid === myUid;
                    const claimed = isAwardClaimed(selectedAward);
                    const now = new Date();
                    const isCurrentMonthView = selectedMonth.month === now.getMonth() && selectedMonth.year === now.getFullYear();
                    return createPortal(
                        <div className="fixed inset-0 z-[300] flex items-center justify-center p-8 backdrop-blur-2xl animate-fade-in pointer-events-auto bg-black/60" onClick={() => setSelectedAward(null)}>
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-[40px] p-8 max-w-sm w-full relative animate-scale-up modal-container pointer-events-auto shadow-2xl shadow-black" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setSelectedAward(null)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-white/40 hover:bg-white/10 transition-colors">
                                    <X size={20} />
                                </button>
                                {isCurrentMonthView && (
                                    <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                        {language === 'fr' ? 'Classement en direct' : 'Live Leaderboard'}
                                    </div>
                                )}
                                <div className="flex flex-col items-center text-center gap-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
                                        <img src={def.imageUrl} className="w-32 h-32 relative animate-float drop-shadow-2xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-amber-500 uppercase mb-2 italic tracking-tight">{language === 'fr' ? def.name_fr : def.name}</h3>
                                        <p className="text-white/40 text-xs font-medium leading-relaxed">{language === 'fr' ? def.description_fr : def.description}</p>
                                    </div>
                                    <div className={`w-full p-5 rounded-[32px] border transition-all ${isMyAward ? 'bg-amber-500/10 border-amber-500/30 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]' : 'bg-white/5 border-white/10'}`}>
                                        <div className="flex items-center gap-4">
                                            <img src={selectedAward.recipientPhoto || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-full border-2 border-white/20 object-cover" />
                                            <div className="text-left">
                                                <div className={`font-black tracking-tight ${isMyAward ? 'text-amber-500' : 'text-white'}`}>@{selectedAward.recipientName}</div>
                                                <div className="text-white/30 text-[10px] font-black uppercase tracking-widest">{selectedAward.value}</div>
                                            </div>
                                        </div>
                                    </div>
                                    {isMyAward && (
                                        <div className="w-full">
                                            <button
                                                onClick={(e) => handleClaim(e, selectedAward)}
                                                disabled={claimed || isClaiming || isCurrentMonthView}
                                                className={`w-full py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all
                                                    ${claimed ? 'bg-white/5 text-white/20 border border-white/10'
                                                        : isCurrentMonthView ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                                                            : 'bg-white text-black'}`}
                                            >
                                                {isClaiming ? (
                                                    <Loader2 className="animate-spin mx-auto" size={16} />
                                                ) : claimed ? (
                                                    (language === 'fr' ? 'Badge Récupéré' : 'Badge Claimed')
                                                ) : isCurrentMonthView ? (
                                                    (language === 'fr' ? 'En cours...' : 'In progress...')
                                                ) : (
                                                    (language === 'fr' ? 'Récupérer le badge' : 'Claim Badge')
                                                )}
                                            </button>

                                            {isCurrentMonthView && (
                                                <p className="mt-4 text-[10px] font-bold text-amber-500/50 uppercase tracking-widest">
                                                    {language === 'fr'
                                                        ? 'Revenez le mois prochain pour récupérer ce badge !'
                                                        : 'Come back next month to claim this badge!'}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>,
                        document.body
                    );
                })()}
            </div>
        </div>,
        document.body
    );
};
