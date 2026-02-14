import React, { useState, useEffect } from 'react';
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

        if (newYear < appLaunch.year || (newYear === appLaunch.year && newMonth < appLaunch.month)) return;
        const now = new Date();
        if (newYear > now.getFullYear() || (newYear === now.getFullYear() && newMonth >= now.getMonth())) return;

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
            const hasOtherModals = document.querySelectorAll('.modal-overlay').length > 1;
            if (!hasOtherModals) {
                document.body.classList.remove('modal-open');
            }
        };
    }, []);

    return (
        <div className="modal-overlay !p-0 !items-stretch !justify-stretch">
            <div className="flex flex-col w-full h-full bg-[#050505] animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] bg-white/5 border-b border-white/5">
                    <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl text-white/60 hover:text-white transition-all">
                        <X size={22} />
                    </button>
                    <div className="text-center">
                        <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2 justify-center">
                            <Trophy size={20} className="text-amber-400" />
                            {language === 'fr' ? 'Awards' : 'Awards'}
                        </h2>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">{groupName}</p>
                    </div>
                    <div className="w-12" />
                </div>

                {/* Month Selector */}
                <div className="flex items-center justify-center gap-6 py-6 px-6">
                    <button onClick={() => navigateMonth(-1)} className="p-3 bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center min-w-[160px]">
                        <h3 className="text-lg font-black text-white">{monthNames[selectedMonth.month]}</h3>
                        <p className="text-[10px] text-white/30 font-bold">{selectedMonth.year}</p>
                    </div>
                    <button onClick={() => navigateMonth(1)} className="p-3 bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-40 no-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <Loader2 className="animate-spin text-amber-400" size={48} />
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                                {language === 'fr' ? 'Calcul des awards...' : 'Computing awards...'}
                            </p>
                        </div>
                    ) : awards.length === 0 ? (
                        <div className="py-32 text-center opacity-40 uppercase font-black tracking-widest text-xs">
                            {language === 'fr' ? 'Aucun award pour ce mois' : 'No awards for this month'}
                        </div>
                    ) : (
                        <>
                            {revealedIndex < 0 && !isRevealing && (
                                <button onClick={handleRevealAll} className="w-full mb-8 py-5 bg-gradient-to-r from-amber-500 to-red-500 rounded-3xl font-black uppercase text-white shadow-xl">
                                    {language === 'fr' ? 'Révéler les Awards' : 'Reveal Awards'}
                                </button>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                {awards.map((award, index) => {
                                    const def = getAwardDef(award.awardId);
                                    if (!def) return null;
                                    const isRevealed = index <= revealedIndex;
                                    return (
                                        <div key={award.awardId} onClick={() => isRevealed && setSelectedAward(award)} className={`glass-panel-3d p-4 flex flex-col items-center gap-3 transition-all duration-500 ${isRevealed ? 'opacity-100' : 'opacity-20 blur-sm pointer-events-none'}`}>
                                            <div className="w-20 h-20">
                                                {isRevealed ? <img src={def.imageUrl} className="w-full h-full object-contain animate-float-slow" /> : <span>❓</span>}
                                            </div>
                                            <h4 className="text-[11px] font-black uppercase text-amber-400">{isRevealed ? (language === 'fr' ? def.name_fr : def.name) : '???'}</h4>
                                            {isRevealed && (
                                                <div className="flex flex-col items-center gap-1">
                                                    <img src={award.recipientPhoto || 'https://via.placeholder.com/150'} className="w-8 h-8 rounded-full border-2 border-white/20" />
                                                    <span className="text-[10px] font-black">@{award.recipientName}</span>
                                                </div>
                                            )}
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
                    return (
                        <div className="nested-modal-overlay fixed inset-0 flex items-center justify-center p-8 backdrop-blur-xl animate-fade-in" onClick={() => setSelectedAward(null)}>
                            <div className="bg-[#0c0c10] border border-white/10 rounded-[40px] p-8 max-w-sm w-full relative animate-scale-in" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setSelectedAward(null)} className="absolute top-4 right-4 text-white/30"><X size={20} /></button>
                                <div className="flex flex-col items-center text-center gap-6">
                                    <img src={def.imageUrl} className="w-32 h-32 animate-float" />
                                    <div>
                                        <h3 className="text-2xl font-black text-amber-400 uppercase mb-2">{language === 'fr' ? def.name_fr : def.name}</h3>
                                        <p className="text-white/40 text-xs">{language === 'fr' ? def.description_fr : def.description}</p>
                                    </div>
                                    <div className={`w-full p-4 rounded-3xl border ${isMyAward ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10'}`}>
                                        <div className="flex items-center gap-3">
                                            <img src={selectedAward.recipientPhoto || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-full border-2 border-white/20" />
                                            <div className="text-left font-black">
                                                <div className={isMyAward ? 'text-amber-400' : 'text-white'}>@{selectedAward.recipientName}</div>
                                                <div className="text-white/30 text-xs">{selectedAward.value}</div>
                                            </div>
                                        </div>
                                    </div>
                                    {isMyAward && (
                                        <button onClick={(e) => handleClaim(e, selectedAward)} disabled={claimed || isClaiming} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-xs">
                                            {claimed ? (language === 'fr' ? 'Récupéré' : 'Claimed') : (language === 'fr' ? 'Récupérer le badge' : 'Claim Badge')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};
